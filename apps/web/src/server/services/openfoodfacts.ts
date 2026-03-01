import type { OpenFoodFactsResult } from "@open-health/shared";

export async function lookupOpenFoodFacts(
  barcode: string
): Promise<OpenFoodFactsResult> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}`,
    {
      headers: { "User-Agent": "OpenHealth/1.0" },
    }
  );

  if (!res.ok) return { found: false };

  const data = await res.json();
  if (data.status !== 1 || !data.product) return { found: false };

  const p = data.product;
  const nutriments = p.nutriments || {};

  const name =
    p.product_name_zh || p.product_name || p.product_name_en || "Unknown";

  let servingSize = 100;
  let servingUnit = "g";
  const servingStr = p.serving_size || "";
  const match = servingStr.match(/^([\d.]+)\s*(g|ml|oz|cup)?/i);
  if (match) {
    servingSize = parseFloat(match[1]) || 100;
    servingUnit = (match[2] || "g").toLowerCase();
  }

  const suffix = nutriments["energy-kcal_serving"] != null ? "_serving" : "_100g";

  return {
    found: true,
    name,
    brand: p.brands || undefined,
    servingSize,
    servingUnit,
    calories: nutriments[`energy-kcal${suffix}`] ?? nutriments[`energy-kcal_100g`] ?? 0,
    protein: nutriments[`proteins${suffix}`] ?? nutriments[`proteins_100g`] ?? 0,
    fat: nutriments[`fat${suffix}`] ?? nutriments[`fat_100g`] ?? 0,
    carbs: nutriments[`carbohydrates${suffix}`] ?? nutriments[`carbohydrates_100g`] ?? 0,
    fiber: nutriments[`fiber${suffix}`] ?? nutriments[`fiber_100g`] ?? undefined,
    sugar: nutriments[`sugars${suffix}`] ?? nutriments[`sugars_100g`] ?? undefined,
    saturatedFat: nutriments[`saturated-fat${suffix}`] ?? nutriments[`saturated-fat_100g`] ?? undefined,
    transFat: nutriments[`trans-fat${suffix}`] ?? nutriments[`trans-fat_100g`] ?? undefined,
    cholesterol: nutriments[`cholesterol${suffix}`] != null
      ? nutriments[`cholesterol${suffix}`] * 1000
      : nutriments[`cholesterol_100g`] != null
        ? nutriments[`cholesterol_100g`] * 1000
        : undefined,
    sodium: nutriments[`sodium${suffix}`] != null
      ? nutriments[`sodium${suffix}`] * 1000
      : nutriments[`sodium_100g`] != null
        ? nutriments[`sodium_100g`] * 1000
        : undefined,
    imageUrl: p.image_url || undefined,
  };
}
