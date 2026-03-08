import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { minimax } from "vercel-minimax-ai-provider";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  diaryEntries,
  foods,
  foodNutrients,
  userGoals,
  chatSessions,
  chatMessages,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { getTaiwanDate } from "@/lib/date";
import { users } from "@/server/db/schema";
import {
  resolveEffectivePlan,
  checkAndIncrementAiUsage,
} from "@/server/services/plan";
import { estimateNutritionFromText } from "@/server/services/ai";
import { NUTRIENT_IDS } from "@open-health/shared/constants";

export async function POST(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const { messages: uiMessages, sessionId } = await req.json();

  // Resolve user plan
  const userRow = await db
    .select({
      plan: users.plan,
      planExpiresAt: users.planExpiresAt,
      trialExpiresAt: users.trialExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .then((r) => r[0]);
  const plan = userRow ? resolveEffectivePlan(userRow) : "free";

  // Daily limit check via ai_usage
  const usage = await checkAndIncrementAiUsage(userId, "chat", plan);
  if (!usage.allowed) {
    return Response.json(
      { error: `已達每日訊息上限（${usage.limit} 則）` },
      { status: 429 }
    );
  }

  // Extract last user message for saving
  const lastUserMsg = [...uiMessages]
    .reverse()
    .find((m: { role: string }) => m.role === "user");

  const userMsgText =
    lastUserMsg?.content ||
    lastUserMsg?.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { text: string }) => p.text)
      .join("") ||
    "";

  // Get or create session (fallback if client didn't pre-create)
  let chatSessionId: string = sessionId;
  if (!chatSessionId) {
    const title = userMsgText.slice(0, 50) || "新對話";
    const [newSession] = await db
      .insert(chatSessions)
      .values({ userId, title })
      .returning({ id: chatSessions.id });
    chatSessionId = newSession.id;
  }

  // Save user message to DB
  if (lastUserMsg && userMsgText) {
    await db.insert(chatMessages).values({
      sessionId: chatSessionId,
      userId,
      role: "user",
      content: userMsgText,
      parts: lastUserMsg.parts ?? null,
    });
  }

  const messages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model: minimax("MiniMax-M2.5"),
    system: `你是一位專業的台灣營養顧問，名叫「小健」。你的任務是根據使用者的飲食紀錄和營養目標，提供個人化的飲食建議。

規則：
1. 一律使用繁體中文回應。
2. 回應簡潔實用，避免過長的說教。
3. 當使用者詢問飲食相關問題時，主動使用工具查詢他們的飲食紀錄和營養目標。
4. 根據實際數據提供具體建議，而非泛泛而談。
5. 使用台灣常見的食物和料理舉例。
6. 適當使用 markdown 格式（粗體、列表等）讓回應更易讀。
7. 今天的日期是 ${getTaiwanDate()}，現在時間約 ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false })}。
8. 當使用者要求記錄食物時（例如「幫我記錄…」「我剛吃了…」「新增…」「記一下…」），使用 createFood 工具。
9. 推測餐別：根據對話上下文或當前時間（05-10 點 breakfast、10-14 點 lunch、14-17 點 snack、17-21 點 dinner、其他 snack）。使用者明確說了餐別就用使用者說的。
10. 日期預設為今天，除非使用者明確提到其他日期。
11. 使用 createFood 後，簡短告知使用者估算結果（不需重複所有數字），提醒他們可以在卡片上確認或編輯。`,
    messages,
    tools: {
      getDailyFood: tool({
        description:
          "查詢使用者指定日期的飲食紀錄，包含每餐吃了什麼、各項營養素攝取量",
        inputSchema: z.object({
          date: z
            .string()
            .describe("要查詢的日期，格式 YYYY-MM-DD，例如 2025-01-15"),
        }),
        execute: async ({ date }) => {
          try {
            const entries = await db
              .select({
                mealType: diaryEntries.mealType,
                calories: diaryEntries.calories,
                proteinG: diaryEntries.proteinG,
                carbsG: diaryEntries.carbsG,
                fatG: diaryEntries.fatG,
                fiberG: diaryEntries.fiberG,
                servingQty: diaryEntries.servingQty,
                foodName: foods.name,
                foodBrand: foods.brand,
              })
              .from(diaryEntries)
              .innerJoin(foods, eq(diaryEntries.foodId, foods.id))
              .where(
                and(
                  eq(diaryEntries.userId, userId),
                  eq(diaryEntries.date, date)
                )
              )
              .orderBy(diaryEntries.mealType, diaryEntries.sortOrder);

            const totals = entries.reduce(
              (acc, e) => ({
                calories: acc.calories + Number(e.calories || 0),
                protein: acc.protein + Number(e.proteinG || 0),
                carbs: acc.carbs + Number(e.carbsG || 0),
                fat: acc.fat + Number(e.fatG || 0),
                fiber: acc.fiber + Number(e.fiberG || 0),
              }),
              { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
            );

            return { date, entries, totals };
          } catch {
            return { error: "查詢飲食紀錄時發生錯誤，請稍後再試" };
          }
        },
      }),
      getUserGoals: tool({
        description: "查詢使用者設定的營養目標（每日熱量、蛋白質、碳水、脂肪目標）",
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const goals = await db.query.userGoals.findFirst({
              where: eq(userGoals.userId, userId),
            });
            return goals ?? { message: "使用者尚未設定營養目標" };
          } catch {
            return { error: "查詢營養目標時發生錯誤，請稍後再試" };
          }
        },
      }),
      createFood: tool({
        description:
          "根據使用者描述的食物，估算營養成分並建立食物資料。當使用者說要記錄、新增、或提到剛吃了什麼食物時使用此工具。",
        inputSchema: z.object({
          description: z
            .string()
            .describe(
              "使用者描述的食物，包含名稱和份量，例如：一碗滷肉飯、兩片吐司加花生醬"
            ),
          mealType: z
            .enum(["breakfast", "lunch", "dinner", "snack"])
            .describe("餐別，根據對話上下文或當前時間推測"),
          date: z
            .string()
            .describe("日期 YYYY-MM-DD，預設今天"),
        }),
        execute: async ({ description, mealType, date }) => {
          try {
            const estimation = await estimateNutritionFromText(description);
            if (!estimation.success) {
              return { error: estimation.error };
            }

            const data = estimation.data;

            // Create food in DB
            const [food] = await db
              .insert(foods)
              .values({
                name: data.foodName,
                brand: data.brand ?? undefined,
                source: "user",
                servingSize: String(data.servingSize),
                servingUnit: data.servingUnit,
                calories: String(data.calories),
                isPublic: true,
                createdBy: userId,
              })
              .returning();

            // Insert nutrients
            const nutrientValues: { foodId: string; nutrientId: number; amount: string }[] = [];
            const addNutrient = (id: number, val: number | null | undefined) => {
              if (val != null) nutrientValues.push({ foodId: food.id, nutrientId: id, amount: String(val) });
            };
            addNutrient(NUTRIENT_IDS.protein, data.proteinG);
            addNutrient(NUTRIENT_IDS.totalFat, data.fatG);
            addNutrient(NUTRIENT_IDS.totalCarbs, data.carbsG);
            addNutrient(NUTRIENT_IDS.fiber, data.fiberG);
            addNutrient(NUTRIENT_IDS.sugar, data.sugarG);
            addNutrient(NUTRIENT_IDS.saturatedFat, data.saturatedFatG);
            addNutrient(NUTRIENT_IDS.transFat, data.transFatG);
            addNutrient(NUTRIENT_IDS.cholesterol, data.cholesterolMg);
            addNutrient(NUTRIENT_IDS.sodium, data.sodiumMg);

            if (nutrientValues.length > 0) {
              await db.insert(foodNutrients).values(nutrientValues);
            }

            return {
              foodId: food.id,
              foodName: data.foodName,
              calories: data.calories,
              proteinG: data.proteinG,
              fatG: data.fatG,
              carbsG: data.carbsG,
              fiberG: data.fiberG ?? 0,
              servingSize: data.servingSize,
              servingUnit: data.servingUnit,
              mealType,
              date,
            };
          } catch (error) {
            console.error("createFood tool error:", error);
            return { error: "建立食物時發生錯誤，請稍後再試" };
          }
        },
      }),
    },
    stopWhen: stepCountIs(3),
    onFinish: async ({ response }) => {
      // Save assistant messages to DB (including tool call parts)
      const assistantMessages = response.messages.filter(
        (m) => m.role === "assistant"
      );

      for (const msg of assistantMessages) {
        const contentParts =
          typeof msg.content === "string"
            ? [{ type: "text" as const, text: msg.content }]
            : msg.content;

        const textContent = contentParts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("");

        // Build parts array for persistence (text + tool-call results)
        const uiParts: unknown[] = [];
        if (textContent) {
          uiParts.push({ type: "text", text: textContent });
        }
        for (const p of contentParts) {
          if (p.type === "tool-call") {
            // Find the corresponding tool result in the response
            const resultMsg = response.messages.find(
              (m) =>
                m.role === "tool" &&
                Array.isArray(m.content) &&
                m.content.some(
                  (c) =>
                    c.type === "tool-result" && c.toolCallId === p.toolCallId
                )
            );
            const resultPart = resultMsg
              ? (
                  resultMsg.content as unknown as Array<{
                    type: string;
                    toolCallId: string;
                    result: unknown;
                  }>
                ).find((c) => c.toolCallId === p.toolCallId)
              : undefined;

            uiParts.push({
              type: "dynamic-tool",
              toolName: p.toolName,
              toolCallId: p.toolCallId,
              state: "output-available",
              input: p.input,
              output: resultPart ? resultPart.result : undefined,
            });
          }
        }

        if (uiParts.length === 0) continue;

        await db.insert(chatMessages).values({
          sessionId: chatSessionId,
          userId,
          role: "assistant",
          content: textContent,
          parts: uiParts,
        });
      }

      // Update session updatedAt
      await db
        .update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessions.id, chatSessionId));
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "x-session-id": chatSessionId,
    },
  });
}
