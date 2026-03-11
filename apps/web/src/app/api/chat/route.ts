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
  weightLogs,
  waterLogs,
  waterGoals,
  exerciseLogs,
  exercises,
  workouts,
  workoutExercises,
  workoutSets,
} from "@/server/db/schema";
import { and, eq, ilike, desc, sql, gte } from "drizzle-orm";
import { getTaiwanDate } from "@/lib/date";
import { users } from "@/server/db/schema";
import {
  resolveEffectivePlan,
  checkAndIncrementAiUsage,
} from "@/server/services/plan";
import { estimateNutritionFromText } from "@/server/services/ai";
import { calculateNutrition } from "@/server/services/nutrition";
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
    system: `你是一位專業的台灣健康顧問，名叫「小健」。你的任務是根據使用者的健康數據（飲食、體重、運動、重訓、水分），提供個人化的健康建議。

規則：
1. 一律使用繁體中文回應。
2. 回應簡潔實用，避免過長的說教。
3. 當使用者詢問健康相關問題時，主動使用工具查詢他們的數據（飲食紀錄、營養目標、體重趨勢、運動紀錄、水分攝取等）。
4. 根據實際數據提供具體建議，而非泛泛而談。
5. 使用台灣常見的食物和料理舉例。
6. 適當使用 markdown 格式（粗體、列表等）讓回應更易讀。
7. 今天的日期是 ${getTaiwanDate()}，現在時間約 ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false })}。
8. 當使用者要求記錄食物時（例如「幫我記錄…」「我剛吃了…」「新增…」「記一下…」），使用 createFood 工具。
9. 推測餐別：根據對話上下文或當前時間（05-10 點 breakfast、10-14 點 lunch、14-17 點 snack、17-21 點 dinner、其他 snack）。使用者明確說了餐別就用使用者說的。
10. 日期預設為今天，除非使用者明確提到其他日期。
11. 使用 createFood 後，簡短告知使用者估算結果（不需重複所有數字），提醒他們可以在卡片上確認或編輯。
12. 當使用者要求記錄體重時（例如「我現在 70 公斤」「體重 65.5」「記一下體重…」），使用 logWeight 工具。
13. 當使用者要求記錄喝水時（例如「我喝了一杯水」「喝了 500ml」「記一下水…」），使用 logWater 工具。常見容量推測：一杯水 250ml、一瓶水 600ml、一大杯 500ml。
14. 當使用者詢問體重趨勢、運動紀錄、重訓歷史、水分攝取等，主動使用對應的查詢工具。
15. 綜合分析時，可以同時查詢多個面向的數據（例如飲食 + 體重 + 運動），給出整合性的建議。
16. 當提供營養或健康建議時，必須附上資訊來源。常見來源包括：衛福部國民健康署「每日飲食指南」、衛福部「國人膳食營養素參考攝取量（DRIs）」、USDA FoodData Central、WHO 飲食指引等。在回應末尾以「📖 參考來源：」格式列出，附上來源名稱。
17. 你提供的建議僅供健康參考，不構成醫療診斷或治療建議。如有疾病或特殊健康狀況，應諮詢醫師或營養師。`,
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

            // Search for existing food with same name created by this user
            const existingFood = await db.query.foods.findFirst({
              where: and(
                ilike(foods.name, data.foodName),
                eq(foods.source, "user"),
                eq(foods.createdBy, userId),
              ),
            });

            let foodId: string;

            if (existingFood) {
              // Reuse existing food record — return its stored nutrition data
              const nutrition = await calculateNutrition(existingFood.id, 1);
              return {
                foodId: existingFood.id,
                foodName: existingFood.name,
                calories: nutrition.calories,
                proteinG: nutrition.proteinG,
                fatG: nutrition.fatG,
                carbsG: nutrition.carbsG,
                fiberG: nutrition.fiberG,
                servingSize: Number(existingFood.servingSize),
                servingUnit: existingFood.servingUnit,
                mealType,
                date,
              };
            } else {
              // Create new food in DB
              const [food] = await db
                .insert(foods)
                .values({
                  name: data.foodName,
                  brand: data.brand ?? undefined,
                  source: "user",
                  servingSize: String(data.servingSize),
                  servingUnit: data.servingUnit,
                  calories: String(data.calories),
                  description: data.notes ?? undefined,
                  isPublic: true,
                  createdBy: userId,
                })
                .returning();
              foodId = food.id;

              // Insert nutrients only for new foods
              const nutrientValues: { foodId: string; nutrientId: number; amount: string }[] = [];
              const addNutrient = (id: number, val: number | null | undefined) => {
                if (val != null && !isNaN(val)) nutrientValues.push({ foodId, nutrientId: id, amount: String(val) });
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
              addNutrient(NUTRIENT_IDS.calcium, data.calciumMg);
              addNutrient(NUTRIENT_IDS.iron, data.ironMg);
              addNutrient(NUTRIENT_IDS.potassium, data.potassiumMg);
              addNutrient(NUTRIENT_IDS.vitaminA, data.vitaminAMcg);
              addNutrient(NUTRIENT_IDS.vitaminC, data.vitaminCMg);
              addNutrient(NUTRIENT_IDS.vitaminD, data.vitaminDMcg);

              if (nutrientValues.length > 0) {
                await db.insert(foodNutrients).values(nutrientValues);
              }
            }

            return {
              foodId,
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
      // ── Weight tools ──
      getWeightHistory: tool({
        description:
          "查詢使用者的體重紀錄，包含最近的體重趨勢",
        inputSchema: z.object({
          days: z
            .number()
            .optional()
            .describe("查詢最近幾天的體重紀錄，預設 30 天"),
        }),
        execute: async ({ days = 30 }) => {
          try {
            const since = new Date();
            since.setDate(since.getDate() - days);
            const sinceStr = since.toISOString().split("T")[0];

            const logs = await db
              .select({
                date: weightLogs.date,
                weightKg: weightLogs.weightKg,
                note: weightLogs.note,
              })
              .from(weightLogs)
              .where(
                and(
                  eq(weightLogs.userId, userId),
                  gte(weightLogs.date, sinceStr)
                )
              )
              .orderBy(desc(weightLogs.date));

            if (logs.length === 0) {
              return { message: "使用者在此期間沒有體重紀錄" };
            }

            const latest = Number(logs[0].weightKg);
            const oldest = Number(logs[logs.length - 1].weightKg);
            const change = latest - oldest;

            return {
              logs: logs.map((l) => ({
                date: l.date,
                weightKg: Number(l.weightKg),
                note: l.note,
              })),
              summary: {
                latest,
                oldest,
                change: Math.round(change * 100) / 100,
                count: logs.length,
              },
            };
          } catch {
            return { error: "查詢體重紀錄時發生錯誤" };
          }
        },
      }),
      logWeight: tool({
        description:
          "記錄使用者的體重。當使用者提到體重數字或要求記錄體重時使用。",
        inputSchema: z.object({
          weightKg: z.number().min(20).max(300).describe("體重（公斤）"),
          date: z.string().optional().describe("日期 YYYY-MM-DD，預設今天"),
          note: z.string().optional().describe("備註"),
        }),
        execute: async ({ weightKg, date: dateInput, note }) => {
          const date = dateInput ?? getTaiwanDate();
          try {
            await db
              .insert(weightLogs)
              .values({
                userId,
                date,
                weightKg: String(weightKg),
                note: note ?? null,
              })
              .onConflictDoUpdate({
                target: [weightLogs.userId, weightLogs.date],
                set: {
                  weightKg: String(weightKg),
                  note: note ?? null,
                },
              });
            return { success: true, weightKg, date, note };
          } catch {
            return { error: "記錄體重時發生錯誤" };
          }
        },
      }),

      // ── Water tools ──
      getWaterIntake: tool({
        description:
          "查詢使用者指定日期的水分攝取量和目標",
        inputSchema: z.object({
          date: z
            .string()
            .optional()
            .describe("要查詢的日期，格式 YYYY-MM-DD，預設今天"),
        }),
        execute: async ({ date: dateInput } = {}) => {
          const date = dateInput ?? getTaiwanDate();
          try {
            const logs = await db
              .select({
                amountMl: waterLogs.amountMl,
                loggedAt: waterLogs.loggedAt,
              })
              .from(waterLogs)
              .where(
                and(
                  eq(waterLogs.userId, userId),
                  eq(waterLogs.date, date)
                )
              )
              .orderBy(desc(waterLogs.loggedAt));

            const totalMl = logs.reduce((sum, l) => sum + l.amountMl, 0);

            const goal = await db.query.waterGoals.findFirst({
              where: eq(waterGoals.userId, userId),
            });
            const targetMl = goal?.dailyTargetMl ?? 2500;

            return {
              date,
              totalMl,
              targetMl,
              percentage: Math.round((totalMl / targetMl) * 100),
              logCount: logs.length,
            };
          } catch {
            return { error: "查詢水分攝取時發生錯誤" };
          }
        },
      }),
      logWater: tool({
        description:
          "記錄使用者的飲水量。當使用者提到喝水或要求記錄水分時使用。",
        inputSchema: z.object({
          amountMl: z.number().min(1).max(5000).describe("飲水量（毫升）"),
          date: z.string().optional().describe("日期 YYYY-MM-DD，預設今天"),
        }),
        execute: async ({ amountMl, date: dateInput }) => {
          const date = dateInput ?? getTaiwanDate();
          try {
            await db.insert(waterLogs).values({
              userId,
              date,
              amountMl,
            });

            // Return updated total for the day
            const [result] = await db
              .select({
                totalMl: sql<number>`coalesce(sum(${waterLogs.amountMl}), 0)`,
              })
              .from(waterLogs)
              .where(
                and(
                  eq(waterLogs.userId, userId),
                  eq(waterLogs.date, date)
                )
              );

            const goal = await db.query.waterGoals.findFirst({
              where: eq(waterGoals.userId, userId),
            });
            const targetMl = goal?.dailyTargetMl ?? 2500;

            return {
              success: true,
              amountMl,
              date,
              totalMl: Number(result.totalMl),
              targetMl,
            };
          } catch {
            return { error: "記錄飲水時發生錯誤" };
          }
        },
      }),

      // ── Exercise tools ──
      getExerciseLogs: tool({
        description:
          "查詢使用者指定日期的運動（有氧）紀錄",
        inputSchema: z.object({
          date: z
            .string()
            .optional()
            .describe("要查詢的日期，格式 YYYY-MM-DD，預設今天"),
        }),
        execute: async ({ date: dateInput } = {}) => {
          const date = dateInput ?? getTaiwanDate();
          try {
            const logs = await db
              .select({
                exerciseName: exercises.name,
                category: exercises.category,
                durationMin: exerciseLogs.durationMin,
                caloriesBurned: exerciseLogs.caloriesBurned,
                intensity: exerciseLogs.intensity,
                note: exerciseLogs.note,
              })
              .from(exerciseLogs)
              .innerJoin(exercises, eq(exerciseLogs.exerciseId, exercises.id))
              .where(
                and(
                  eq(exerciseLogs.userId, userId),
                  eq(exerciseLogs.date, date)
                )
              );

            const totalCalories = logs.reduce(
              (sum, l) => sum + Number(l.caloriesBurned || 0),
              0
            );
            const totalMinutes = logs.reduce(
              (sum, l) => sum + Number(l.durationMin || 0),
              0
            );

            return {
              date,
              logs: logs.map((l) => ({
                ...l,
                caloriesBurned: Number(l.caloriesBurned || 0),
              })),
              summary: { totalCalories, totalMinutes, count: logs.length },
            };
          } catch {
            return { error: "查詢運動紀錄時發生錯誤" };
          }
        },
      }),

      // ── Workout (strength training) tools ──
      getWorkoutHistory: tool({
        description:
          "查詢使用者最近的重訓紀錄，包含每次訓練的動作、組數、重量和次數",
        inputSchema: z.object({
          limit: z
            .number()
            .optional()
            .describe("查詢最近幾次重訓，預設 5 次"),
        }),
        execute: async ({ limit = 5 }) => {
          try {
            const recentWorkouts = await db
              .select({
                id: workouts.id,
                name: workouts.name,
                startedAt: workouts.startedAt,
                completedAt: workouts.completedAt,
                durationSec: workouts.durationSec,
                note: workouts.note,
              })
              .from(workouts)
              .where(
                and(
                  eq(workouts.userId, userId),
                  sql`${workouts.completedAt} IS NOT NULL`
                )
              )
              .orderBy(desc(workouts.startedAt))
              .limit(limit);

            if (recentWorkouts.length === 0) {
              return { message: "使用者沒有重訓紀錄" };
            }

            const results = [];
            for (const w of recentWorkouts) {
              const wExercises = await db
                .select({
                  weId: workoutExercises.id,
                  exerciseName: exercises.name,
                })
                .from(workoutExercises)
                .innerJoin(
                  exercises,
                  eq(workoutExercises.exerciseId, exercises.id)
                )
                .where(eq(workoutExercises.workoutId, w.id))
                .orderBy(workoutExercises.sortOrder);

              const exerciseDetails = [];
              for (const we of wExercises) {
                const sets = await db
                  .select({
                    setNumber: workoutSets.setNumber,
                    weightKg: workoutSets.weightKg,
                    reps: workoutSets.reps,
                    isWarmup: workoutSets.isWarmup,
                  })
                  .from(workoutSets)
                  .where(eq(workoutSets.workoutExerciseId, we.weId))
                  .orderBy(workoutSets.setNumber);

                exerciseDetails.push({
                  name: we.exerciseName,
                  sets: sets.map((s) => ({
                    set: s.setNumber,
                    weightKg: s.weightKg ? Number(s.weightKg) : null,
                    reps: s.reps,
                    isWarmup: s.isWarmup,
                  })),
                });
              }

              results.push({
                name: w.name,
                date: w.startedAt?.toISOString().split("T")[0],
                durationMin: w.durationSec
                  ? Math.round(w.durationSec / 60)
                  : null,
                exercises: exerciseDetails,
              });
            }

            return { workouts: results };
          } catch {
            return { error: "查詢重訓紀錄時發生錯誤" };
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
