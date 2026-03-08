import { z } from "zod";
import { logFoodSchema, copyMealSchema, removeEntrySchema } from "@open-health/shared/schemas";
import { protectedProcedure, router } from "../trpc";
import { diaryEntries, quickFoods, foodNutrients, nutrientDefinitions } from "@/server/db/schema";
import { foods } from "@/server/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { calculateNutrition } from "@/server/services/nutrition";

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

  logFood: protectedProcedure
    .input(logFoodSchema)
    .mutation(async ({ ctx, input }) => {
      const nutrition = await calculateNutrition(input.foodId, input.servingQty);

      // Upsert: if same food exists in the same meal, increment qty & nutrition
      await ctx.db
        .insert(diaryEntries)
        .values({
          userId: ctx.user.id,
          date: input.date,
          mealType: input.mealType,
          foodId: input.foodId,
          servingQty: String(input.servingQty),
          servingId: input.servingId,
          calories: String(nutrition.calories),
          proteinG: String(nutrition.proteinG),
          carbsG: String(nutrition.carbsG),
          fatG: String(nutrition.fatG),
          fiberG: String(nutrition.fiberG),
        })
        .onConflictDoUpdate({
          target: [diaryEntries.userId, diaryEntries.date, diaryEntries.mealType, diaryEntries.foodId],
          set: {
            servingQty: sql`cast(${diaryEntries.servingQty} as numeric) + ${input.servingQty}`,
            calories: sql`cast(${diaryEntries.calories} as numeric) + ${nutrition.calories}`,
            proteinG: sql`cast(${diaryEntries.proteinG} as numeric) + ${nutrition.proteinG}`,
            carbsG: sql`cast(${diaryEntries.carbsG} as numeric) + ${nutrition.carbsG}`,
            fatG: sql`cast(${diaryEntries.fatG} as numeric) + ${nutrition.fatG}`,
            fiberG: sql`cast(${diaryEntries.fiberG} as numeric) + ${nutrition.fiberG}`,
          },
        });

      await ctx.db
        .insert(quickFoods)
        .values({
          userId: ctx.user.id,
          foodId: input.foodId,
          useCount: 1,
        })
        .onConflictDoUpdate({
          target: [quickFoods.userId, quickFoods.foodId],
          set: {
            useCount: sql`${quickFoods.useCount} + 1`,
            lastUsedAt: sql`now()`,
          },
        });

      return { success: true };
    }),

  removeEntry: protectedProcedure
    .input(removeEntrySchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(diaryEntries)
        .where(
          and(eq(diaryEntries.id, input.entryId), eq(diaryEntries.userId, ctx.user.id))
        );

      return { success: true };
    }),

  getDayNutrients: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        nutrientIds: z.array(z.number()).min(1).max(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select({
          nutrientId: foodNutrients.nutrientId,
          name: nutrientDefinitions.name,
          unit: nutrientDefinitions.unit,
          dailyValue: nutrientDefinitions.dailyValue,
          totalAmount: sql<string>`sum(cast(${foodNutrients.amount} as numeric) * cast(${diaryEntries.servingQty} as numeric))`,
        })
        .from(diaryEntries)
        .innerJoin(foodNutrients, eq(foodNutrients.foodId, diaryEntries.foodId))
        .innerJoin(nutrientDefinitions, eq(nutrientDefinitions.id, foodNutrients.nutrientId))
        .where(
          and(
            eq(diaryEntries.userId, ctx.user.id),
            eq(diaryEntries.date, input.date),
            inArray(foodNutrients.nutrientId, input.nutrientIds)
          )
        )
        .groupBy(foodNutrients.nutrientId, nutrientDefinitions.name, nutrientDefinitions.unit, nutrientDefinitions.dailyValue);

      return results.map((r) => ({
        nutrientId: r.nutrientId,
        name: r.name,
        unit: r.unit,
        dailyValue: r.dailyValue ? Number(r.dailyValue) : null,
        totalAmount: Number(r.totalAmount || 0),
      }));
    }),

  copyMealToDate: protectedProcedure
    .input(copyMealSchema)
    .mutation(async ({ ctx, input }) => {
      const entries = await ctx.db
        .select()
        .from(diaryEntries)
        .where(
          and(
            eq(diaryEntries.userId, ctx.user.id),
            eq(diaryEntries.date, input.fromDate),
            eq(diaryEntries.mealType, input.mealType)
          )
        );

      if (entries.length === 0) {
        return { success: false, error: "No entries found" };
      }

      // Upsert each entry: if same food already exists in target meal, merge quantities
      for (const entry of entries) {
        await ctx.db
          .insert(diaryEntries)
          .values({
            userId: ctx.user.id,
            date: input.toDate,
            mealType: entry.mealType,
            foodId: entry.foodId,
            servingQty: entry.servingQty,
            servingId: entry.servingId,
            calories: entry.calories,
            proteinG: entry.proteinG,
            carbsG: entry.carbsG,
            fatG: entry.fatG,
            fiberG: entry.fiberG,
          })
          .onConflictDoUpdate({
            target: [diaryEntries.userId, diaryEntries.date, diaryEntries.mealType, diaryEntries.foodId],
            set: {
              servingQty: sql`cast(${diaryEntries.servingQty} as numeric) + cast(excluded.serving_qty as numeric)`,
              calories: sql`cast(${diaryEntries.calories} as numeric) + cast(excluded.calories as numeric)`,
              proteinG: sql`cast(${diaryEntries.proteinG} as numeric) + cast(excluded.protein_g as numeric)`,
              carbsG: sql`cast(${diaryEntries.carbsG} as numeric) + cast(excluded.carbs_g as numeric)`,
              fatG: sql`cast(${diaryEntries.fatG} as numeric) + cast(excluded.fat_g as numeric)`,
              fiberG: sql`cast(${diaryEntries.fiberG} as numeric) + cast(excluded.fiber_g as numeric)`,
            },
          });
      }

      return { success: true };
    }),
});
