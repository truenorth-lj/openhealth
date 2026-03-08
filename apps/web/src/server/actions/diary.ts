"use server";

import { z } from "zod";
import { logFoodSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { diaryEntries, quickFoods } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateNutrition } from "@/server/services/nutrition";

export async function logFood(input: z.infer<typeof logFoodSchema>) {
  const user = await getSession();
  const validated = logFoodSchema.parse(input);
  const nutrition = await calculateNutrition(validated.foodId, validated.servingQty);

  // Upsert: if same food exists in the same meal, increment qty & nutrition
  await db
    .insert(diaryEntries)
    .values({
      userId: user.id,
      date: validated.date,
      mealType: validated.mealType,
      foodId: validated.foodId,
      servingQty: String(validated.servingQty),
      servingId: validated.servingId,
      calories: String(nutrition.calories),
      proteinG: String(nutrition.proteinG),
      carbsG: String(nutrition.carbsG),
      fatG: String(nutrition.fatG),
      fiberG: String(nutrition.fiberG),
    })
    .onConflictDoUpdate({
      target: [diaryEntries.userId, diaryEntries.date, diaryEntries.mealType, diaryEntries.foodId],
      set: {
        servingQty: sql`cast(${diaryEntries.servingQty} as numeric) + ${validated.servingQty}`,
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
      userId: user.id,
      foodId: validated.foodId,
      useCount: 1,
    })
    .onConflictDoUpdate({
      target: [quickFoods.userId, quickFoods.foodId],
      set: {
        useCount: sql`${quickFoods.useCount} + 1`,
        lastUsedAt: sql`now()`,
      },
    });

  revalidatePath(`/diary`);
  return { success: true };
}

export async function removeEntry(entryId: string) {
  const user = await getSession();

  await db
    .delete(diaryEntries)
    .where(
      and(eq(diaryEntries.id, entryId), eq(diaryEntries.userId, user.id))
    );

  revalidatePath(`/diary`);
  return { success: true };
}

export async function copyMealToDate(
  fromDate: string,
  toDate: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const user = await getSession();

  const entries = await db
    .select()
    .from(diaryEntries)
    .where(
      and(
        eq(diaryEntries.userId, user.id),
        eq(diaryEntries.date, fromDate),
        eq(diaryEntries.mealType, mealType)
      )
    );

  if (entries.length === 0) return { success: false, error: "No entries found" };

  // Upsert each entry: if same food already exists in target meal, merge quantities
  for (const entry of entries) {
    await db
      .insert(diaryEntries)
      .values({
        userId: user.id,
        date: toDate,
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

  revalidatePath(`/diary`);
  return { success: true };
}
