import { z } from "zod";
import { NUTRIENT_IDS } from "@open-health/shared/constants";
import { createFoodSchema, createFoodFromBarcodeSchema } from "@open-health/shared/schemas";
import { foods, foodNutrients, foodServings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { db as dbType } from "@/server/db";

type Db = typeof dbType;

export async function createCustomFood(
  db: Db,
  userId: string,
  input: z.infer<typeof createFoodSchema>
) {
  const [food] = await db
    .insert(foods)
    .values({
      name: input.name,
      brand: input.brand,
      barcode: input.barcode,
      source: "user",
      servingSize: String(input.servingSize),
      servingUnit: input.servingUnit,
      householdServing: input.householdServing,
      description: input.description,
      calories: String(input.calories),
      isPublic: true,
      createdBy: userId,
    })
    .returning();

  if (input.nutrients?.length) {
    await db.insert(foodNutrients).values(
      input.nutrients.map((n) => ({
        foodId: food.id,
        nutrientId: n.nutrientId,
        amount: String(n.amount),
      }))
    );
  }

  if (input.alternateServings?.length) {
    await db.insert(foodServings).values(
      input.alternateServings.map((s) => ({
        foodId: food.id,
        label: s.label,
        grams: String(s.grams),
      }))
    );
  }

  return { foodId: food.id };
}

export async function createFoodFromBarcode(
  db: Db,
  userId: string,
  input: z.infer<typeof createFoodFromBarcodeSchema>
) {
  // Check if barcode already exists
  const existing = await db.query.foods.findFirst({
    where: eq(foods.barcode, input.barcode),
  });

  if (existing) {
    return { foodId: existing.id, alreadyExisted: true };
  }

  const [food] = await db
    .insert(foods)
    .values({
      name: input.name,
      brand: input.brand,
      barcode: input.barcode,
      source: "openfoodfacts",
      sourceId: input.barcode,
      servingSize: String(input.servingSize),
      servingUnit: input.servingUnit,
      calories: String(input.calories),
      isPublic: true,
      createdBy: userId,
      metadata: input.imageUrl ? { imageUrl: input.imageUrl } : undefined,
    })
    .returning();

  // Build nutrients array
  const nutrients: { foodId: string; nutrientId: number; amount: string }[] = [
    { foodId: food.id, nutrientId: NUTRIENT_IDS.protein, amount: String(input.protein) },
    { foodId: food.id, nutrientId: NUTRIENT_IDS.totalFat, amount: String(input.fat) },
    { foodId: food.id, nutrientId: NUTRIENT_IDS.totalCarbs, amount: String(input.carbs) },
  ];

  if (input.fiber != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.fiber, amount: String(input.fiber) });
  }
  if (input.sugar != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.sugar, amount: String(input.sugar) });
  }
  if (input.saturatedFat != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.saturatedFat, amount: String(input.saturatedFat) });
  }
  if (input.transFat != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.transFat, amount: String(input.transFat) });
  }
  if (input.cholesterol != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.cholesterol, amount: String(input.cholesterol) });
  }
  if (input.sodium != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.sodium, amount: String(input.sodium) });
  }

  if (nutrients.length > 0) {
    await db.insert(foodNutrients).values(nutrients);
  }

  return { foodId: food.id, alreadyExisted: false };
}
