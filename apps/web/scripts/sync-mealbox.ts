/**
 * 台灣健康餐盒品牌同步腳本
 * 靜態資料寫入 DB：給力盒子、能量小姐、蛋白盒子
 * 已存在的商品（以 source + sourceId 判斷）會跳過，不會重複
 *
 * 用法：
 *   cd apps/web && source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mealbox
 *   cd apps/web && source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mealbox -- --dry-run
 *   cd apps/web && source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mealbox -- --brand getpower
 *   cd apps/web && source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mealbox -- --brand missenergy
 *   cd apps/web && source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mealbox -- --brand proteinbox
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

// ---------- Types ----------

type FoodSource = "getpower" | "missenergy" | "proteinbox";

interface MealItem {
  sourceId: string;
  name: string;
  calories: number;
  /** serving size in grams (estimate for a full meal box) */
  servingSize: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  sodium?: number;
  fiber?: number;
}

interface BrandConfig {
  source: FoodSource;
  brand: string;
  items: MealItem[];
}

// ---------- 給力盒子 GET POWER ----------

const getpowerItems: MealItem[] = [
  { sourceId: "gp-bass", name: "樹子清蒸鱸魚", calories: 555, servingSize: 450, protein: 34, fat: 3, carbs: 98 },
  { sourceId: "gp-mackerel", name: "鹽烤鯖魚", calories: 484, servingSize: 420, protein: 34, fat: 7, carbs: 72 },
  { sourceId: "gp-salmon", name: "大厚切烤鮭魚", calories: 605, servingSize: 450, protein: 47, fat: 15, carbs: 72 },
  { sourceId: "gp-beef-tendon", name: "十三香滷牛腱", calories: 487, servingSize: 420, protein: 37, fat: 6, carbs: 72 },
  { sourceId: "gp-veggie", name: "西西里烤蔬菜", calories: 422, servingSize: 400, protein: 18, fat: 3, carbs: 82 },
  { sourceId: "gp-chicken-breast", name: "椒鹽水煮雞胸", calories: 605, servingSize: 450, protein: 43, fat: 5, carbs: 97 },
  { sourceId: "gp-shrimp", name: "特調白蝦仁", calories: 538, servingSize: 430, protein: 31, fat: 2, carbs: 99 },
  { sourceId: "gp-basil-chicken", name: "塔香火烤雞胸", calories: 613, servingSize: 450, protein: 43, fat: 5, carbs: 99 },
  { sourceId: "gp-cali-chicken", name: "南加州烤雞腿", calories: 714, servingSize: 480, protein: 48, fat: 14, carbs: 99 },
  { sourceId: "gp-tofu", name: "五味板烤豆腐", calories: 380, servingSize: 400 },
  { sourceId: "gp-miso-pork", name: "味噌烤豬里肌", calories: 520, servingSize: 430 },
  { sourceId: "gp-thai-chicken", name: "泰式打拋雞胸", calories: 560, servingSize: 440 },
  { sourceId: "gp-garlic-pork", name: "蒜泥醬豬肉片", calories: 500, servingSize: 430 },
  { sourceId: "gp-viet-pork", name: "越式檸檬豬肉片", calories: 510, servingSize: 430 },
];

// ---------- 能量小姐 Miss Energy ----------

const missenergyItems: MealItem[] = [
  // 正常飯版
  { sourceId: "me-chicken-breast", name: "水煮嫩雞胸", calories: 546, servingSize: 450 },
  { sourceId: "me-salt-koji", name: "鹽麴雞", calories: 469, servingSize: 420 },
  { sourceId: "me-garlic-chicken", name: "蒜香雞", calories: 470, servingSize: 420 },
  { sourceId: "me-salmon", name: "鮭魚", calories: 542, servingSize: 430 },
  { sourceId: "me-korean-mushroom", name: "韓式菇菇雞", calories: 602, servingSize: 450 },
  { sourceId: "me-peanut-chicken", name: "花生香菜麻醬雞", calories: 578, servingSize: 440 },
  { sourceId: "me-braised-leg", name: "香滷雞腿", calories: 602, servingSize: 450 },
  { sourceId: "me-kimchi-pork", name: "泡菜豬里肌", calories: 469, servingSize: 420 },
  { sourceId: "me-mackerel", name: "鹽烤鯖魚", calories: 542, servingSize: 430 },
  { sourceId: "me-beef-brisket", name: "澳洲牛腩", calories: 527, servingSize: 430 },
  { sourceId: "me-thai-chicken", name: "泰式酸辣雞", calories: 505, servingSize: 430 },
  // 半飯版
  { sourceId: "me-chicken-breast-half", name: "水煮嫩雞胸（半飯）", calories: 432, servingSize: 380 },
  { sourceId: "me-salt-koji-half", name: "鹽麴雞（半飯）", calories: 355, servingSize: 350 },
  { sourceId: "me-garlic-chicken-half", name: "蒜香雞（半飯）", calories: 357, servingSize: 350 },
  { sourceId: "me-salmon-half", name: "鮭魚（半飯）", calories: 429, servingSize: 360 },
  { sourceId: "me-korean-mushroom-half", name: "韓式菇菇雞（半飯）", calories: 488, servingSize: 380 },
  { sourceId: "me-peanut-chicken-half", name: "花生香菜麻醬雞（半飯）", calories: 465, servingSize: 370 },
  { sourceId: "me-braised-leg-half", name: "香滷雞腿（半飯）", calories: 488, servingSize: 380 },
  { sourceId: "me-kimchi-pork-half", name: "泡菜豬里肌（半飯）", calories: 355, servingSize: 350 },
  { sourceId: "me-mackerel-half", name: "鹽烤鯖魚（半飯）", calories: 429, servingSize: 360 },
  { sourceId: "me-beef-brisket-half", name: "澳洲牛腩（半飯）", calories: 413, servingSize: 360 },
  { sourceId: "me-thai-chicken-half", name: "泰式酸辣雞（半飯）", calories: 395, servingSize: 360 },
];

// ---------- 蛋白盒子 The Protein Box ----------

const proteinboxItems: MealItem[] = [
  { sourceId: "pb-hk-chicken", name: "港式蔥薑雞胸", calories: 443, servingSize: 420 },
  { sourceId: "pb-sichuan-chicken", name: "四川麻辣雞胸", calories: 440, servingSize: 420 },
  { sourceId: "pb-lemon-leg", name: "檸檬雞腿排", calories: 445, servingSize: 430 },
  { sourceId: "pb-minced-pork", name: "打拋豬", calories: 375, servingSize: 400, protein: 13 },
  { sourceId: "pb-beef-tendon", name: "私房滷牛腱", calories: 418, servingSize: 420 },
  { sourceId: "pb-sukiyaki-beef", name: "壽喜牛五花", calories: 575, servingSize: 440 },
  { sourceId: "pb-veggie", name: "蔬菜組合（素）", calories: 245, servingSize: 350 },
  { sourceId: "pb-grilled-chicken", name: "香煎雞胸", calories: 430, servingSize: 420 },
  { sourceId: "pb-salt-chicken", name: "青蔥海鹽雞胸", calories: 435, servingSize: 420 },
  { sourceId: "pb-bbq-chicken", name: "炭火燒肉雞胸", calories: 450, servingSize: 420 },
  { sourceId: "pb-nola-leg", name: "紐澳良雞腿排", calories: 460, servingSize: 430 },
  { sourceId: "pb-pepper-leg", name: "青花椒雞腿排", calories: 455, servingSize: 430 },
  { sourceId: "pb-herb-leg", name: "五香藥膳嫩雞腿", calories: 420, servingSize: 420 },
  { sourceId: "pb-kimchi-pork", name: "低脂梅花泡菜豬", calories: 440, servingSize: 420 },
  { sourceId: "pb-miso-bass", name: "減鹽味噌烤鱸魚", calories: 400, servingSize: 430 },
  { sourceId: "pb-salmon", name: "薄鹽烤鮭魚", calories: 480, servingSize: 430 },
  { sourceId: "pb-hamburg", name: "燒肉店的漢堡排", calories: 500, servingSize: 440 },
  { sourceId: "pb-korean-pork", name: "韓式辣醬豬", calories: 450, servingSize: 420 },
  { sourceId: "pb-korean-beef", name: "韓式辣醬牛", calories: 470, servingSize: 430 },
  { sourceId: "pb-ginger-pork", name: "薑燒低脂梅花豬", calories: 430, servingSize: 420 },
  { sourceId: "pb-whitebait", name: "清炒吻仔魚", calories: 390, servingSize: 400 },
  { sourceId: "pb-matsusaka", name: "香煎霜降松阪豬", calories: 520, servingSize: 430 },
];

// ---------- Brand configs ----------

const BRANDS: Record<string, BrandConfig> = {
  getpower: { source: "getpower", brand: "給力盒子 GET POWER", items: getpowerItems },
  missenergy: { source: "missenergy", brand: "能量小姐 Miss Energy", items: missenergyItems },
  proteinbox: { source: "proteinbox", brand: "蛋白盒子 The Protein Box", items: proteinboxItems },
};

// ---------- Nutrient name mapping ----------

const NUTRIENT_NAMES = {
  protein: "Protein",
  fat: "Total Fat",
  carbs: "Total Carbohydrate",
  sodium: "Sodium",
  fiber: "Dietary Fiber",
} as const;

// ---------- Main ----------

const DB_BATCH = 50;

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const dryRun = args.includes("--dry-run");
  const brandIdx = args.indexOf("--brand");
  const brandFilter = brandIdx !== -1 ? args[brandIdx + 1] : null;

  console.log("=== 台灣健康餐盒同步 ===\n");

  // Validate brand filter
  const brandsToSync = brandFilter
    ? { [brandFilter]: BRANDS[brandFilter] }
    : BRANDS;

  if (brandFilter && !BRANDS[brandFilter]) {
    console.error(`ERROR: 未知品牌 "${brandFilter}"。可用: ${Object.keys(BRANDS).join(", ")}`);
    process.exit(1);
  }

  // Connect DB
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL 未設定。請執行: source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:mealbox");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  // Load nutrient definitions
  const allNutrientDefs = await db.select().from(nutrientDefinitions);
  const nutrientIdMap = new Map<string, number>();
  for (const n of allNutrientDefs) {
    if (!nutrientIdMap.has(n.name)) {
      nutrientIdMap.set(n.name, n.id);
    }
  }

  let totalInserted = 0;

  for (const [key, config] of Object.entries(brandsToSync)) {
    console.log(`\n--- ${config.brand} (source: ${config.source}) ---`);

    // Check existing
    const existingRows = await db
      .select({ sourceId: foods.sourceId })
      .from(foods)
      .where(eq(foods.source, config.source));
    const existingIds = new Set(existingRows.map((r) => r.sourceId));
    console.log(`DB 中已有 ${existingIds.size} 項`);

    // Filter new items
    const newItems = config.items.filter((item) => !existingIds.has(item.sourceId));
    console.log(`需新增 ${newItems.length} 項（跳過 ${config.items.length - newItems.length} 項已存在）`);

    if (newItems.length === 0) continue;

    if (dryRun) {
      console.log("\n[DRY RUN] 新商品：");
      for (const item of newItems) {
        const macros = [
          item.protein != null ? `P:${item.protein}g` : null,
          item.fat != null ? `F:${item.fat}g` : null,
          item.carbs != null ? `C:${item.carbs}g` : null,
        ].filter(Boolean).join(" ");
        console.log(`  - ${item.name} | ${item.calories} kcal${macros ? " | " + macros : ""}`);
      }
      continue;
    }

    // Insert in batches
    type FoodRow = typeof foods.$inferInsert;
    type NutrientRow = { foodId: string; nutrientId: number; amount: string };
    type ServingRow = typeof foodServings.$inferInsert;

    let foodBuffer: FoodRow[] = [];
    let nutrientBuffer: { nutrients: Record<string, number>; sourceId: string }[] = [];
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
        const match = nutrientBuffer.find((b) => b.sourceId === insertedFood.sourceId);
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

      if (nutrientRows.length > 0) {
        for (let j = 0; j < nutrientRows.length; j += 200) {
          await db.insert(foodNutrients).values(nutrientRows.slice(j, j + 200));
        }
      }

      // Insert servings
      const servingRows: ServingRow[] = [];
      for (const insertedFood of insertedFoods) {
        const match = servingBuffer.find((b) => b.sourceId === insertedFood.sourceId);
        if (!match) continue;
        servingRows.push({
          foodId: insertedFood.id,
          label: "1 份",
          grams: String(match.servingSize),
        });
      }

      if (servingRows.length > 0) {
        for (let j = 0; j < servingRows.length; j += DB_BATCH) {
          await db.insert(foodServings).values(servingRows.slice(j, j + DB_BATCH));
        }
      }

      inserted += insertedFoods.length;
      foodBuffer = [];
      nutrientBuffer = [];
      servingBuffer = [];
    }

    for (const item of newItems) {
      // Build nutrient map
      const nutrients: Record<string, number> = {};
      if (item.protein != null) nutrients[NUTRIENT_NAMES.protein] = item.protein;
      if (item.fat != null) nutrients[NUTRIENT_NAMES.fat] = item.fat;
      if (item.carbs != null) nutrients[NUTRIENT_NAMES.carbs] = item.carbs;
      if (item.sodium != null) nutrients[NUTRIENT_NAMES.sodium] = item.sodium;
      if (item.fiber != null) nutrients[NUTRIENT_NAMES.fiber] = item.fiber;

      foodBuffer.push({
        name: item.name,
        brand: config.brand,
        source: config.source,
        sourceId: item.sourceId,
        servingSize: String(item.servingSize),
        servingUnit: "g",
        calories: String(item.calories),
        isVerified: true,
        isPublic: true,
        metadata: {},
      });
      nutrientBuffer.push({ nutrients, sourceId: item.sourceId });
      servingBuffer.push({ sourceId: item.sourceId, servingSize: item.servingSize });

      if (foodBuffer.length >= DB_BATCH) {
        await flushBuffer();
      }
    }

    await flushBuffer();
    console.log(`✓ 寫入 ${inserted} 項`);
    totalInserted += inserted;
  }

  console.log(`\n========================================`);
  console.log(`同步完成！共新增 ${totalInserted} 項`);
  console.log(`========================================`);

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("同步失敗:", err);
  process.exit(1);
});
