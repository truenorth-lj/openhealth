import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { diaryEntries } from "@/server/db/schema";
import { foods } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const diaryRouter = router({
  getDay: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db
        .select({
          id: diaryEntries.id,
          mealType: diaryEntries.mealType,
          servingQty: diaryEntries.servingQty,
          calories: diaryEntries.calories,
          proteinG: diaryEntries.proteinG,
          carbsG: diaryEntries.carbsG,
          fatG: diaryEntries.fatG,
          fiberG: diaryEntries.fiberG,
          sortOrder: diaryEntries.sortOrder,
          loggedAt: diaryEntries.loggedAt,
          foodId: diaryEntries.foodId,
          foodName: foods.name,
          foodBrand: foods.brand,
          foodServingSize: foods.servingSize,
          foodServingUnit: foods.servingUnit,
        })
        .from(diaryEntries)
        .innerJoin(foods, eq(diaryEntries.foodId, foods.id))
        .where(
          and(
            eq(diaryEntries.userId, ctx.user.id),
            eq(diaryEntries.date, input.date)
          )
        )
        .orderBy(diaryEntries.mealType, diaryEntries.sortOrder);

      const totals = entries.reduce(
        (acc, entry) => ({
          calories: acc.calories + Number(entry.calories || 0),
          protein: acc.protein + Number(entry.proteinG || 0),
          carbs: acc.carbs + Number(entry.carbsG || 0),
          fat: acc.fat + Number(entry.fatG || 0),
          fiber: acc.fiber + Number(entry.fiberG || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );

      return { entries, totals };
    }),

  getWeekSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const summary = await ctx.db
        .select({
          date: diaryEntries.date,
          totalCalories: sql<number>`sum(${diaryEntries.calories})::numeric`,
          totalProtein: sql<number>`sum(${diaryEntries.proteinG})::numeric`,
          totalCarbs: sql<number>`sum(${diaryEntries.carbsG})::numeric`,
          totalFat: sql<number>`sum(${diaryEntries.fatG})::numeric`,
          totalFiber: sql<number>`sum(${diaryEntries.fiberG})::numeric`,
          entryCount: sql<number>`count(*)::int`,
        })
        .from(diaryEntries)
        .where(
          and(
            eq(diaryEntries.userId, ctx.user.id),
            sql`${diaryEntries.date} >= ${input.startDate}`,
            sql`${diaryEntries.date} <= ${input.endDate}`
          )
        )
        .groupBy(diaryEntries.date)
        .orderBy(diaryEntries.date);

      return summary;
    }),
});
