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

  await db.insert(diaryEntries).values({
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

  await db.insert(diaryEntries).values(
    entries.map((entry) => ({
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
    }))
  );

  revalidatePath(`/diary`);
  return { success: true };
}
