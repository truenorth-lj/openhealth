import { z } from "zod";
import { logFoodSchema } from "@open-health/shared/schemas";
import { diaryEntries, quickFoods } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { calculateNutrition } from "./nutrition";
import type { db as dbType } from "@/server/db";
import type { MealType } from "@open-health/shared/types";

type Db = typeof dbType;

export async function logFood(
  db: Db,
  userId: string,
  input: z.infer<typeof logFoodSchema>
) {
  const nutrition = await calculateNutrition(input.foodId, input.servingQty);

  // Upsert: if same food exists in the same meal, increment qty & nutrition
  await db
    .insert(diaryEntries)
    .values({
      userId,
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

  // Update quick foods (recently used)
  await db
    .insert(quickFoods)
    .values({
      userId,
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
}

export async function removeEntry(db: Db, userId: string, entryId: string) {
  await db
    .delete(diaryEntries)
    .where(
      and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, userId))
    );
}

export async function updateEntryServings(
  db: Db,
  userId: string,
  entryId: string,
  newServingQty: number
) {
  // Fetch current entry to get foodId
  const entry = await db
    .select({ foodId: diaryEntries.foodId })
    .from(diaryEntries)
    .where(
      and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, userId))
    )
    .then((rows) => rows[0]);

  if (!entry) throw new Error(`Entry not found: ${entryId}`);

  // Recalculate nutrition from source food data (avoids floating point drift)
  const nutrition = await calculateNutrition(entry.foodId, newServingQty);

  await db
    .update(diaryEntries)
    .set({
      servingQty: String(newServingQty),
      calories: String(nutrition.calories),
      proteinG: String(nutrition.proteinG),
      carbsG: String(nutrition.carbsG),
      fatG: String(nutrition.fatG),
      fiberG: String(nutrition.fiberG),
    })
    .where(
      and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, userId))
    );
}

export async function copyMealToDate(
  db: Db,
  userId: string,
  input: { fromDate: string; toDate: string; mealType: MealType }
) {
  const entries = await db
    .select()
    .from(diaryEntries)
    .where(
      and(
        eq(diaryEntries.userId, userId),
        eq(diaryEntries.date, input.fromDate),
        eq(diaryEntries.mealType, input.mealType)
      )
    );

  if (entries.length === 0) return { success: false, error: "No entries found" };

  // Upsert each entry: if same food already exists in target meal, merge quantities
  for (const entry of entries) {
    await db
      .insert(diaryEntries)
      .values({
        userId,
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
}
