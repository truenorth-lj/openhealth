import { eq, and, isNull, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { foods, foodNutrients, nutrientDefinitions } from "../schema";
import { NUTRIENT_KEY_TO_NAME } from "./nutrient-mapping";

export interface FoodItem {
  name: string;
  brand: string | null;
  source: "usda" | "openfoodfacts" | "user" | "verified" | "family" | "seven";
  sourceId?: string;
  servingSize: number;
  servingUnit: string;
  householdServing?: string;
  calories: number;
  nutrients: Record<string, number>;
  metadata?: Record<string, unknown>;
}

function buildNutrientRows(
  foodId: string,
  nutrients: Record<string, number>,
  nutrientMap: Map<string, number>,
  foodName: string,
) {
  return Object.entries(nutrients)
    .map(([key, amount]) => {
      if (typeof amount !== "number" || isNaN(amount)) return null;
      const nutrientName = NUTRIENT_KEY_TO_NAME[key] ?? key;
      const nutrientId = nutrientMap.get(nutrientName);
      if (!nutrientId) {
        console.warn(`  ⚠ Nutrient "${nutrientName}" not found in DB for "${foodName}"`);
        return null;
      }
      return { foodId, nutrientId, amount: String(amount) };
    })
    .filter(Boolean) as { foodId: string; nutrientId: number; amount: string }[];
}

/**
 * Seed foods one-by-one. Good for small datasets (<100 items).
 */
export async function seedFoods(
  db: PostgresJsDatabase,
  items: FoodItem[],
  label: string,
) {
  const allNutrients = await db.select().from(nutrientDefinitions);
  const nutrientMap = new Map<string, number>();
  allNutrients.forEach((n) => nutrientMap.set(n.name, n.id));

  let inserted = 0;
  let skipped = 0;

  for (const foodData of items) {
    let existing;
    if (foodData.sourceId) {
      existing = await db
        .select({ id: foods.id })
        .from(foods)
        .where(and(eq(foods.source, foodData.source), eq(foods.sourceId, foodData.sourceId)))
        .limit(1);
    } else {
      const brandCondition =
        foodData.brand !== null
          ? eq(foods.brand, foodData.brand)
          : isNull(foods.brand);
      existing = await db
        .select({ id: foods.id })
        .from(foods)
        .where(and(eq(foods.name, foodData.name), brandCondition))
        .limit(1);
    }

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const [food] = await db
      .insert(foods)
      .values({
        name: foodData.name,
        brand: foodData.brand,
        source: foodData.source,
        sourceId: foodData.sourceId ?? null,
        servingSize: String(foodData.servingSize),
        servingUnit: foodData.servingUnit,
        householdServing: foodData.householdServing ?? null,
        calories: String(foodData.calories),
        isVerified: foodData.source === "verified",
        isPublic: true,
        metadata: foodData.metadata ?? null,
      })
      .returning();

    const nutrientValues = buildNutrientRows(food.id, foodData.nutrients, nutrientMap, foodData.name);
    if (nutrientValues.length > 0) {
      await db.insert(foodNutrients).values(nutrientValues);
    }

    inserted++;
  }

  console.log(`  [${label}] ${inserted} inserted, ${skipped} skipped (already exist)`);
}

/**
 * Bulk seed foods in batches. Optimized for large datasets (1000+ items).
 * Requires all items to have sourceId for fast dedup.
 */
export async function seedFoodsBulk(
  db: PostgresJsDatabase,
  items: FoodItem[],
  label: string,
) {
  const allNutrients = await db.select().from(nutrientDefinitions);
  const nutrientMap = new Map<string, number>();
  allNutrients.forEach((n) => nutrientMap.set(n.name, n.id));

  // Batch check existing sourceIds
  const source = items[0]?.source;
  if (!source) return;

  const existingRows = await db
    .select({ sourceId: foods.sourceId })
    .from(foods)
    .where(eq(foods.source, source));
  const existingIds = new Set(existingRows.map((r) => r.sourceId));

  const toInsert = items.filter((item) => !existingIds.has(item.sourceId!));
  console.log(`  [${label}] ${items.length} total, ${items.length - toInsert.length} already exist, ${toInsert.length} to insert`);

  if (toInsert.length === 0) return;

  const BATCH = 50;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);

    // Batch insert foods
    const insertedFoods = await db
      .insert(foods)
      .values(
        batch.map((item) => ({
          name: item.name,
          brand: item.brand,
          source: item.source,
          sourceId: item.sourceId ?? null,
          servingSize: String(item.servingSize),
          servingUnit: item.servingUnit,
          householdServing: item.householdServing ?? null,
          calories: String(item.calories),
          isVerified: false,
          isPublic: true,
          metadata: item.metadata ?? null,
        })),
      )
      .returning({ id: foods.id, sourceId: foods.sourceId });

    // Build nutrient rows for all inserted foods
    const allNutrientRows: { foodId: string; nutrientId: number; amount: string }[] = [];
    for (const insertedFood of insertedFoods) {
      const originalItem = batch.find((b) => b.sourceId === insertedFood.sourceId);
      if (!originalItem) continue;
      const rows = buildNutrientRows(insertedFood.id, originalItem.nutrients, nutrientMap, originalItem.name);
      allNutrientRows.push(...rows);
    }

    // Batch insert nutrients (chunk to avoid param limit)
    const NUTRIENT_BATCH = 200;
    for (let j = 0; j < allNutrientRows.length; j += NUTRIENT_BATCH) {
      const chunk = allNutrientRows.slice(j, j + NUTRIENT_BATCH);
      await db.insert(foodNutrients).values(chunk);
    }

    inserted += insertedFoods.length;
    process.stdout.write(`  [${label}] ${inserted}/${toInsert.length} inserted\r`);
  }

  console.log(`  [${label}] ${inserted}/${toInsert.length} inserted - done`);
}
