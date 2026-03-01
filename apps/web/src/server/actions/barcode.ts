"use server";

import { z } from "zod";
import { NUTRIENT_IDS } from "@open-health/shared";
import { createFoodFromBarcodeSchema } from "@open-health/shared/schemas";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { foods, foodNutrients } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { lookupOpenFoodFacts } from "@/server/services/openfoodfacts";

export { lookupOpenFoodFacts };

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function createFoodFromBarcode(
  input: z.infer<typeof createFoodFromBarcodeSchema>
) {
  const user = await getSession();
  const validated = createFoodFromBarcodeSchema.parse(input);

  // Check if barcode already exists
  const existing = await db.query.foods.findFirst({
    where: eq(foods.barcode, validated.barcode),
  });

  if (existing) {
    return { success: true, foodId: existing.id };
  }

  const [food] = await db
    .insert(foods)
    .values({
      name: validated.name,
      brand: validated.brand,
      barcode: validated.barcode,
      source: "openfoodfacts",
      sourceId: validated.barcode,
      servingSize: String(validated.servingSize),
      servingUnit: validated.servingUnit,
      calories: String(validated.calories),
      isPublic: true,
      createdBy: user.id,
      metadata: validated.imageUrl ? { imageUrl: validated.imageUrl } : undefined,
    })
    .returning();

  // Build nutrients array
  const nutrients: { foodId: string; nutrientId: number; amount: string }[] = [
    { foodId: food.id, nutrientId: NUTRIENT_IDS.protein, amount: String(validated.protein) },
    { foodId: food.id, nutrientId: NUTRIENT_IDS.totalFat, amount: String(validated.fat) },
    { foodId: food.id, nutrientId: NUTRIENT_IDS.totalCarbs, amount: String(validated.carbs) },
  ];

  if (validated.fiber != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.fiber, amount: String(validated.fiber) });
  }
  if (validated.sugar != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.sugar, amount: String(validated.sugar) });
  }
  if (validated.saturatedFat != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.saturatedFat, amount: String(validated.saturatedFat) });
  }
  if (validated.transFat != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.transFat, amount: String(validated.transFat) });
  }
  if (validated.cholesterol != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.cholesterol, amount: String(validated.cholesterol) });
  }
  if (validated.sodium != null) {
    nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.sodium, amount: String(validated.sodium) });
  }

  if (nutrients.length > 0) {
    await db.insert(foodNutrients).values(nutrients);
  }

  revalidatePath("/food");
  return { success: true, foodId: food.id };
}
