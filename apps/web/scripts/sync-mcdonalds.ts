/**
 * 台灣麥當勞食品同步腳本
 * 從 McDonald's /dnaapp/ API 爬取食品資料及營養資訊，直接寫入 DB
 * 已存在的商品（以 source + sourceId 判斷）會跳過，不會重複
 *
 * 用法：
 *   source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mcdonalds
 *   source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mcdonalds -- --dry-run
 *   source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mcdonalds -- --limit 10
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import {
  foods,
  foodNutrients,
  nutrientDefinitions,
  foodServings,
} from "../src/server/db/schema";

// ---------- Constants ----------

const API_BASE = "https://www.mcdonalds.com/dnaapp";
const COUNTRY = "TW";
const LANGUAGE = "zh";

// Item ID range for Taiwan McDonald's
const ITEM_ID_START = 200000;
const ITEM_ID_END = 200400;

// Rate limiting
const FETCH_BATCH = 5;
const DELAY_MS = 1500; // 1.5s between batches to respect rate limits
const DB_BATCH = 50;

// McDonald's nutrient_name_id → our nutrient_definitions name mapping
const NUTRIENT_MAP: Record<string, string> = {
  protein: "Protein",
  fat: "Total Fat",
  carbohydrate: "Total Carbohydrate",
  dietary_fibre: "Dietary Fiber",
  sugars: "Total Sugars",
  saturated_fat: "Saturated Fat",
  trans_fat: "Trans Fat",
  salt: "Sodium", // McDonald's API returns sodium in mg
};

// ---------- API Types ----------

interface McCategory {
  category_id: number;
  category_marketing_name: string;
  category_name: string;
  count_of_items: number;
  display_order: number;
}

interface McNutrient {
  nutrient_name_id: string;
  name: string;
  value: string;
  uom: string;
}

interface McComponent {
  product_marketing_name: string;
  product_id: number;
  quantity: string;
  serving_size: string;
  nutrient_facts?: { nutrient: McNutrient[] };
}

interface McItem {
  item_id: number;
  item_marketing_name: string;
  menu_item_no?: string;
  item_allergen?: string;
  item_additional_allergen?: string;
  nutrient_facts?: { nutrient: McNutrient[] };
  components?: { component: McComponent[] };
  categories?: { category: McCategory[] };
}

// ---------- API ----------

const HEADERS: Record<string, string> = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

async function fetchCategories(): Promise<McCategory[]> {
  const url = `${API_BASE}/categories?country=${COUNTRY}&language=${LANGUAGE}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Categories API failed: ${res.status}`);
  const data = await res.json();
  return data?.categories?.category ?? [];
}

async function fetchItem(itemId: number): Promise<McItem | null> {
  const url = `${API_BASE}/itemDetails?country=${COUNTRY}&language=${LANGUAGE}&showLiveData=true&item=${itemId}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.item ?? null;
  } catch {
    return null;
  }
}

// ---------- Parse ----------

function parseNutrientValue(value: string): number | null {
  if (!value) return null;
  // Remove commas and whitespace: "1,200" → "1200"
  const cleaned = value.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function extractNutrients(
  nutrients: McNutrient[]
): {
  calories: number | null;
  servingSize: number | null;
  nutrientMap: Record<string, number>;
} {
  let calories: number | null = null;
  let servingSize: number | null = null;
  const nutrientMap: Record<string, number> = {};

  for (const n of nutrients) {
    const val = parseNutrientValue(n.value);
    if (val === null) continue;

    if (n.nutrient_name_id === "energy_kcal") {
      calories = val;
    } else if (n.nutrient_name_id === "primary_serving_size") {
      servingSize = val;
    } else if (NUTRIENT_MAP[n.nutrient_name_id]) {
      nutrientMap[NUTRIENT_MAP[n.nutrient_name_id]] = val;
    }
  }

  return { calories, servingSize, nutrientMap };
}

function extractAllergens(item: McItem): string[] {
  const allergens: string[] = [];
  if (item.item_allergen && typeof item.item_allergen === "string") {
    allergens.push(
      ...item.item_allergen
        .split(/[、,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }
  return allergens;
}

function extractCategory(item: McItem): string {
  if (item.categories?.category?.[0]) {
    return (
      item.categories.category[0].category_marketing_name ||
      item.categories.category[0].category_name ||
      ""
    );
  }
  return "";
}

// ---------- Main ----------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;
  const dryRun = args.includes("--dry-run");

  console.log("=== 台灣麥當勞食品同步 ===\n");

  // --- Step 1: 取得分類資訊 ---
  console.log("1. 取得分類資訊...");
  let categories: McCategory[] = [];
  try {
    categories = await fetchCategories();
    console.log(`   共 ${categories.length} 個分類：`);
    for (const cat of categories) {
      console.log(
        `   - ${cat.category_marketing_name} (${cat.count_of_items} 項)`
      );
    }
  } catch (err) {
    console.warn(`   分類取得失敗，繼續爬取品項: ${err}`);
  }

  // --- Step 2: 連接 DB ---
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "ERROR: DATABASE_URL 未設定。請執行: source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mcdonalds"
    );
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  // --- Step 3: 查詢已存在的麥當勞商品 ---
  console.log("\n2. 查詢 DB 中已存在的麥當勞商品...");
  const existingRows = await db
    .select({ sourceId: foods.sourceId })
    .from(foods)
    .where(eq(foods.source, "mcdonalds"));
  const existingIds = new Set(existingRows.map((r) => r.sourceId));
  console.log(`   DB 中已有 ${existingIds.size} 項麥當勞商品\n`);

  // --- Step 4: 載入營養素對照表 ---
  const allNutrientDefs = await db.select().from(nutrientDefinitions);
  // Use the first occurrence of each nutrient name (lowest id)
  const nutrientIdMap = new Map<string, number>();
  for (const n of allNutrientDefs) {
    if (!nutrientIdMap.has(n.name)) {
      nutrientIdMap.set(n.name, n.id);
    }
  }

  // --- Step 5: 爬取所有品項 ---
  console.log("3. 爬取麥當勞品項...\n");

  type ParsedFood = {
    sourceId: string;
    name: string;
    calories: number;
    servingSize: number;
    nutrients: Record<string, number>;
    allergens: string[];
    category: string;
    itemId: number;
  };

  const allItems: ParsedFood[] = [];
  let fetched = 0;
  let notFound = 0;
  let noCalories = 0;

  // Generate all item IDs to try
  const allItemIds: number[] = [];
  for (let id = ITEM_ID_START; id <= ITEM_ID_END; id++) {
    allItemIds.push(id);
  }

  // Filter out already existing
  const itemIdsToFetch = allItemIds.filter(
    (id) => !existingIds.has(`mcdonalds-${id}`)
  );
  const itemIdsLimited = itemIdsToFetch.slice(0, limit);

  console.log(
    `   掃描 ID 範圍: ${ITEM_ID_START}–${ITEM_ID_END} (${allItemIds.length} 個)`
  );
  console.log(
    `   需要爬取: ${itemIdsLimited.length} 個（跳過 ${existingIds.size} 個已存在）\n`
  );

  for (let i = 0; i < itemIdsLimited.length; i += FETCH_BATCH) {
    const batch = itemIdsLimited.slice(i, i + FETCH_BATCH);

    const results = await Promise.allSettled(batch.map((id) => fetchItem(id)));

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const itemId = batch[j];
      fetched++;

      if (result.status !== "fulfilled" || !result.value) {
        notFound++;
        continue;
      }

      const item = result.value;
      const nutrients = item.nutrient_facts?.nutrient ?? [];

      if (nutrients.length === 0) {
        notFound++;
        continue;
      }

      const { calories, servingSize, nutrientMap } =
        extractNutrients(nutrients);

      if (calories === null || calories <= 0) {
        noCalories++;
        continue;
      }

      allItems.push({
        sourceId: `mcdonalds-${itemId}`,
        name: item.item_marketing_name,
        calories,
        servingSize: servingSize ?? 1,
        nutrients: nutrientMap,
        allergens: extractAllergens(item),
        category: extractCategory(item),
        itemId,
      });

      process.stdout.write(
        `  ✓ ${item.item_marketing_name} (${calories} kcal)\n`
      );
    }

    process.stdout.write(
      `  [${Math.min(fetched, itemIdsLimited.length)}/${itemIdsLimited.length}] 已爬取，${allItems.length} 項有效\r`
    );

    if (i + FETCH_BATCH < itemIdsLimited.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(
    `\n\n   爬取完成: ${allItems.length} 項有效，${notFound} 項不存在，${noCalories} 項無熱量\n`
  );

  if (allItems.length === 0) {
    console.log("沒有新商品需要同步！");
    await client.end();
    process.exit(0);
  }

  if (dryRun) {
    console.log("[DRY RUN] 新商品列表：");
    for (const item of allItems.slice(0, 30)) {
      console.log(
        `  - ${item.name} | ${item.calories} kcal | ${item.category}`
      );
      const nutrientStr = Object.entries(item.nutrients)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      if (nutrientStr) console.log(`    營養素: ${nutrientStr}`);
    }
    if (allItems.length > 30)
      console.log(`  ... 還有 ${allItems.length - 30} 項`);
    await client.end();
    process.exit(0);
  }

  // --- Step 6: 寫入 DB ---
  console.log("4. 寫入 DB...\n");

  type FoodRow = typeof foods.$inferInsert;
  type NutrientRow = { foodId: string; nutrientId: number; amount: string };
  type ServingRow = typeof foodServings.$inferInsert;

  let foodBuffer: FoodRow[] = [];
  let nutrientBuffer: { nutrients: Record<string, number>; sourceId: string }[] =
    [];
  let servingBuffer: { sourceId: string; servingSize: number }[] = [];
  let inserted = 0;

  async function flushBuffer() {
    if (foodBuffer.length === 0) return;

    const insertedFoods = await db
      .insert(foods)
      .values(foodBuffer)
      .returning({ id: foods.id, sourceId: foods.sourceId });

    // Insert nutrients
    const nutrientRows: NutrientRow[] = [];
    for (const insertedFood of insertedFoods) {
      const match = nutrientBuffer.find(
        (b) => b.sourceId === insertedFood.sourceId
      );
      if (!match) continue;

      for (const [name, amount] of Object.entries(match.nutrients)) {
        if (typeof amount !== "number" || isNaN(amount)) continue;
        const nutrientId = nutrientIdMap.get(name);
        if (!nutrientId) continue;
        nutrientRows.push({
          foodId: insertedFood.id,
          nutrientId,
          amount: String(amount),
        });
      }
    }

    const NUTRIENT_BATCH = 200;
    for (let j = 0; j < nutrientRows.length; j += NUTRIENT_BATCH) {
      await db
        .insert(foodNutrients)
        .values(nutrientRows.slice(j, j + NUTRIENT_BATCH));
    }

    // Insert servings (original serving as "1 份")
    const servingRows: ServingRow[] = [];
    for (const insertedFood of insertedFoods) {
      const match = servingBuffer.find(
        (b) => b.sourceId === insertedFood.sourceId
      );
      if (!match || !match.servingSize) continue;
      servingRows.push({
        foodId: insertedFood.id,
        label: "1 份",
        grams: String(match.servingSize),
      });
    }

    if (servingRows.length > 0) {
      for (let j = 0; j < servingRows.length; j += DB_BATCH) {
        await db
          .insert(foodServings)
          .values(servingRows.slice(j, j + DB_BATCH));
      }
    }

    inserted += insertedFoods.length;
    foodBuffer = [];
    nutrientBuffer = [];
    servingBuffer = [];
  }

  for (const item of allItems) {
    foodBuffer.push({
      name: item.name,
      brand: "麥當勞 McDonald's",
      source: "mcdonalds",
      sourceId: item.sourceId,
      servingSize: String(item.servingSize),
      servingUnit: "g",
      calories: String(item.calories),
      isVerified: true,
      isPublic: true,
      metadata: {
        externalUrl: `https://www.mcdonalds.com/tw/zh-tw/product/${item.itemId}.html`,
        allergens: item.allergens,
        category: item.category,
      },
    });
    nutrientBuffer.push({ nutrients: item.nutrients, sourceId: item.sourceId });
    servingBuffer.push({
      sourceId: item.sourceId,
      servingSize: item.servingSize,
    });

    if (foodBuffer.length >= DB_BATCH) {
      await flushBuffer();
      process.stdout.write(
        `  ${inserted}/${allItems.length} 已寫入 DB\r`
      );
    }
  }

  // Flush remaining
  await flushBuffer();

  console.log(`\n========================================`);
  console.log(`同步完成！`);
  console.log(`  新增寫入 DB：${inserted} 項`);
  console.log(`  DB 原有：${existingIds.size} 項`);
  console.log(`  DB 現有：${existingIds.size + inserted} 項`);
  console.log(`========================================`);

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("同步失敗:", err);
  process.exit(1);
});
