import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { minimax } from "vercel-minimax-ai-provider";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  diaryEntries,
  foods,
  userGoals,
  chatSessions,
  chatMessages,
} from "@/server/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { getTaiwanDate, getTaipeiTodayStart } from "@/lib/date";

const DAILY_MESSAGE_LIMIT = 100;

export async function POST(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const { messages: uiMessages, sessionId } = await req.json();

  // Daily limit check
  const todayStart = getTaipeiTodayStart();
  const [usageResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.userId, userId),
        eq(chatMessages.role, "user"),
        gte(chatMessages.createdAt, todayStart)
      )
    );

  if ((usageResult?.count ?? 0) >= DAILY_MESSAGE_LIMIT) {
    return Response.json(
      { error: "已達每日訊息上限（100 則）" },
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
7. 今天的日期是 ${getTaiwanDate()}。`,
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
    },
    stopWhen: stepCountIs(3),
    onFinish: async ({ response }) => {
      // Save assistant messages to DB
      const assistantMessages = response.messages.filter(
        (m) => m.role === "assistant"
      );

      for (const msg of assistantMessages) {
        const textContent =
          typeof msg.content === "string"
            ? msg.content
            : msg.content
                .filter((p) => p.type === "text")
                .map((p) => p.text)
                .join("");

        if (!textContent) continue;

        await db.insert(chatMessages).values({
          sessionId: chatSessionId,
          userId,
          role: "assistant",
          content: textContent,
          parts: [{ type: "text", text: textContent }],
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
