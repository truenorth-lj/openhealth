"use server";

import { z } from "zod";
import { logFoodSchema } from "@open-health/shared/schemas";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { diaryEntries, quickFoods, foods, foodNutrients, nutrientDefinitions } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function calculateNutrition(foodId: string, servingQty: number) {
  const food = await db.query.foods.findFirst({
    where: eq(foods.id, foodId),
  });
  if (!food) throw new Error("Food not found");

  const macros = await db
    .select({
      name: nutrientDefinitions.name,
      amount: foodNutrients.amount,
    })
    .from(foodNutrients)
    .innerJoin(nutrientDefinitions, eq(foodNutrients.nutrientId, nutrientDefinitions.id))
    .where(
      and(
        eq(foodNutrients.foodId, foodId),
        sql`${nutrientDefinitions.name} IN ('Protein', 'Total Carbohydrate', 'Total Fat', 'Dietary Fiber')`
      )
    );

  const macroMap: Record<string, number> = {};
  macros.forEach((m) => {
    macroMap[m.name] = Number(m.amount) * servingQty;
  });

  return {
    calories: Number(food.calories) * servingQty,
    proteinG: macroMap["Protein"] || 0,
    carbsG: macroMap["Total Carbohydrate"] || 0,
    fatG: macroMap["Total Fat"] || 0,
    fiberG: macroMap["Dietary Fiber"] || 0,
  };
}

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

  for (const entry of entries) {
    await db.insert(diaryEntries).values({
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
    });
  }

  revalidatePath(`/diary`);
  return { success: true };
}
