"use server";

import { z } from "zod";
import { NUTRIENT_IDS, type OpenFoodFactsResult } from "@open-health/shared";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { foods, foodNutrients } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function lookupOpenFoodFacts(
  barcode: string
): Promise<OpenFoodFactsResult> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}`,
    {
      headers: { "User-Agent": "OpenHealth/1.0" },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return { found: false };

  const data = await res.json();
  if (data.status !== 1 || !data.product) return { found: false };

  const p = data.product;
  const nutriments = p.nutriments || {};

  // Product name priority: zh → generic → en
  const name =
    p.product_name_zh || p.product_name || p.product_name_en || "Unknown";

  // Parse serving size from string like "100g" or "30 ml"
  let servingSize = 100;
  let servingUnit = "g";
  const servingStr = p.serving_size || "";
  const match = servingStr.match(/^([\d.]+)\s*(g|ml|oz|cup)?/i);
  if (match) {
    servingSize = parseFloat(match[1]) || 100;
    servingUnit = (match[2] || "g").toLowerCase();
  }

  // Use per-serving values if available, otherwise per-100g
  const suffix = nutriments["energy-kcal_serving"] != null ? "_serving" : "_100g";
  const getSuffix = suffix;

  return {
    found: true,
    name,
    brand: p.brands || undefined,
    servingSize,
    servingUnit,
    calories: nutriments[`energy-kcal${getSuffix}`] ?? nutriments[`energy-kcal_100g`] ?? 0,
    protein: nutriments[`proteins${getSuffix}`] ?? nutriments[`proteins_100g`] ?? 0,
    fat: nutriments[`fat${getSuffix}`] ?? nutriments[`fat_100g`] ?? 0,
    carbs: nutriments[`carbohydrates${getSuffix}`] ?? nutriments[`carbohydrates_100g`] ?? 0,
    fiber: nutriments[`fiber${getSuffix}`] ?? nutriments[`fiber_100g`] ?? undefined,
    sugar: nutriments[`sugars${getSuffix}`] ?? nutriments[`sugars_100g`] ?? undefined,
    saturatedFat: nutriments[`saturated-fat${getSuffix}`] ?? nutriments[`saturated-fat_100g`] ?? undefined,
    transFat: nutriments[`trans-fat${getSuffix}`] ?? nutriments[`trans-fat_100g`] ?? undefined,
    cholesterol: nutriments[`cholesterol${getSuffix}`] != null
      ? nutriments[`cholesterol${getSuffix}`] * 1000 // OFF stores in g, convert to mg
      : nutriments[`cholesterol_100g`] != null
        ? nutriments[`cholesterol_100g`] * 1000
        : undefined,
    sodium: nutriments[`sodium${getSuffix}`] != null
      ? nutriments[`sodium${getSuffix}`] * 1000 // OFF stores in g, convert to mg
      : nutriments[`sodium_100g`] != null
        ? nutriments[`sodium_100g`] * 1000
        : undefined,
    imageUrl: p.image_url || undefined,
  };
}

const createFoodFromBarcodeSchema = z.object({
  barcode: z.string().min(1),
  name: z.string().min(1).max(500),
  brand: z.string().max(255).optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string().min(1).max(50),
  calories: z.number().min(0),
  protein: z.number().min(0),
  fat: z.number().min(0),
  carbs: z.number().min(0),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  saturatedFat: z.number().min(0).optional(),
  transFat: z.number().min(0).optional(),
  cholesterol: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  imageUrl: z.string().optional(),
});

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
