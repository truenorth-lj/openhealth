/**
 * 全家便利商店食品同步腳本
 * 從 foodsafety.family.com.tw 爬取食品資料，直接寫入 DB
 * 已存在的商品（以 source + sourceId 判斷）會跳過，不會重複
 *
 * 用法：
 *   source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:family
 *   source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:family -- --limit 10   # 測試用
 *   source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:family -- --dry-run     # 只爬取不寫入
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { foods, foodNutrients, nutrientDefinitions } from "../src/server/db/schema";

// ---------- Constants ----------

const BASE_URL = "https://foodsafety.family.com.tw/Web_FFD_2022";
const PROD_IMG_URL = "https://foodsafety.family.com.tw/product_img/";
const EXTERNAL_URL_BASE = "https://foodsafety.family.com.tw/Web_FFD_2022/#/product/";

const HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  Accept: "application/json, text/plain, */*",
  Origin: "https://foodsafety.family.com.tw",
  Referer: "https://foodsafety.family.com.tw/Web_FFD_2022/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// ---------- API Types ----------

interface ProductListItem {
  CMNO: string;
  PRODNAME: string;
  NOTE: string | null;
  PROD_PIC: string;
  SHOW_MAP: string;
}

interface Category {
  CATEGORY_ID: string;
  CATEGORY_NAME: string;
  ITEM: ProductListItem[];
}

interface Nutrient {
  PROTEIN: number | null;
  TOTALFAT: number | null;
  SATFAT: number | null;
  TRANSFAT: number | null;
  CARBOHYDRATE: number | null;
  SODIUM: number | null;
  SUGAR: number | null;
  CAFFEINE: number | null;
}

interface ProductDetail {
  CMNO: string;
  PRODNAME: string;
  PROD_TYPE: string;
  NOTE: string | null;
  PROD_PIC: string;
  VEND_DESC: string;
  CATEGORY_NAME: string;
  NUTRIENTS: Nutrient[];
  ANAPHY: string[];
}

// ---------- API ----------

async function fetchProductList(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/ws/QueryFsProductListByFilter`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ KEYWORD: "", MEMBER: "N" }),
  });
  const data = await res.json();
  if (data.RESULT_CODE !== "00") {
    throw new Error(`QueryFsProductListByFilter failed: ${data.RESULT_DESC}`);
  }
  return data.LIST;
}

async function fetchProductDetail(cmno: string): Promise<ProductDetail[]> {
  const res = await fetch(`${BASE_URL}/ws/QueryFsProductByItem`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ CMNO: cmno }),
  });
  const data = await res.json();
  if (data.RESULT_CODE !== "00") {
    throw new Error(`QueryFsProductByItem(${cmno}) failed: ${data.RESULT_DESC}`);
  }
  return data.LIST;
}

// ---------- Parse ----------

const SERVING_UNIT_MAP: Record<string, string> = {
  公克: "g",
  公升: "L",
  毫升: "ml",
};

function parseNote(note: string | null) {
  if (!note) return { calories: null as number | null, servingSize: null as number | null, servingUnit: "份" };

  const calMatch = note.match(/熱量(\d+(?:\.\d+)?)\s*大卡/);
  const servingMatch = note.match(/每份規格(\d+(?:\.\d+)?)\s*(公克|公升|毫升)/);

  return {
    calories: calMatch ? parseFloat(calMatch[1]) : null,
    servingSize: servingMatch ? parseFloat(servingMatch[1]) : null,
    servingUnit: servingMatch ? SERVING_UNIT_MAP[servingMatch[2]] || servingMatch[2] : "份",
  };
}

const isNum = (v: unknown): v is number => typeof v === "number" && !isNaN(v);

function parseNutrients(nutrient: Nutrient | undefined): Record<string, number> {
  if (!nutrient) return {};
  const result: Record<string, number> = {};
  if (isNum(nutrient.PROTEIN)) result["Protein"] = nutrient.PROTEIN;
  if (isNum(nutrient.TOTALFAT)) result["Total Fat"] = nutrient.TOTALFAT;
  if (isNum(nutrient.SATFAT)) result["Saturated Fat"] = nutrient.SATFAT;
  if (isNum(nutrient.TRANSFAT)) result["Trans Fat"] = nutrient.TRANSFAT;
  if (isNum(nutrient.CARBOHYDRATE)) result["Total Carbohydrate"] = nutrient.CARBOHYDRATE;
  if (isNum(nutrient.SODIUM)) result["Sodium"] = nutrient.SODIUM;
  if (isNum(nutrient.SUGAR)) result["Total Sugars"] = nutrient.SUGAR;
  if (isNum(nutrient.CAFFEINE)) result["Caffeine"] = nutrient.CAFFEINE;
  return result;
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

  console.log("=== 全家 FamilyMart 食品同步 ===\n");

  // --- Step 1: 取得商品列表 ---
  console.log("1. 取得商品列表...");
  const categories = await fetchProductList();
  const allItems: { cmno: string; name: string; category: string }[] = [];
  for (const cat of categories) {
    for (const item of cat.ITEM) {
      allItems.push({ cmno: item.CMNO, name: item.PRODNAME, category: cat.CATEGORY_NAME });
    }
  }
  const itemsToFetch = allItems.slice(0, limit);
  console.log(`   共 ${allItems.length} 項商品，本次處理 ${itemsToFetch.length} 項\n`);

  // --- Step 2: 連接 DB，查詢已存在的 sourceId ---
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL 未設定。請執行: source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:family");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("2. 查詢 DB 中已存在的全家商品...");
  const existingRows = await db
    .select({ sourceId: foods.sourceId })
    .from(foods)
    .where(eq(foods.source, "family"));
  const existingIds = new Set(existingRows.map((r) => r.sourceId));
  console.log(`   DB 中已有 ${existingIds.size} 項全家商品\n`);

  // 過濾掉已存在的
  const newItems = itemsToFetch.filter((item) => !existingIds.has(item.cmno));
  console.log(`   需要新增：${newItems.length} 項（跳過 ${itemsToFetch.length - newItems.length} 項已存在）\n`);

  if (newItems.length === 0) {
    console.log("沒有新商品需要同步，已是最新！");
    await client.end();
    process.exit(0);
  }

  if (dryRun) {
    console.log("[DRY RUN] 新商品列表：");
    for (const item of newItems.slice(0, 20)) {
      console.log(`  - ${item.name} (${item.cmno})`);
    }
    if (newItems.length > 20) console.log(`  ... 還有 ${newItems.length - 20} 項`);
    await client.end();
    process.exit(0);
  }

  // --- Step 3: 載入營養素對照表 ---
  const allNutrientDefs = await db.select().from(nutrientDefinitions);
  const nutrientMap = new Map<string, number>();
  allNutrientDefs.forEach((n) => nutrientMap.set(n.name, n.id));

  // --- Step 4: 爬取新商品詳情 + 寫入 DB ---
  console.log("3. 爬取新商品詳情並寫入 DB...\n");

  const FETCH_BATCH = 5;
  const DELAY_MS = 300;
  const DB_BATCH = 50;

  let fetched = 0;
  let inserted = 0;
  let noCalories = 0;
  let fetchErrors = 0;

  // 暫存待寫入的資料
  type FoodRow = typeof foods.$inferInsert;
  type NutrientRow = { foodId: string; nutrientId: number; amount: string };
  let foodBuffer: FoodRow[] = [];
  let nutrientBuffer: { nutrients: Record<string, number>; sourceId: string }[] = [];

  async function flushBuffer() {
    if (foodBuffer.length === 0) return;

    const insertedFoods = await db
      .insert(foods)
      .values(foodBuffer)
      .returning({ id: foods.id, sourceId: foods.sourceId });

    const nutrientRows: NutrientRow[] = [];
    for (const insertedFood of insertedFoods) {
      const match = nutrientBuffer.find((b) => b.sourceId === insertedFood.sourceId);
      if (!match) continue;

      for (const [name, amount] of Object.entries(match.nutrients)) {
        if (typeof amount !== "number" || isNaN(amount)) continue;
        const nutrientId = nutrientMap.get(name);
        if (!nutrientId) continue;
        nutrientRows.push({ foodId: insertedFood.id, nutrientId, amount: String(amount) });
      }
    }

    // 分批寫入營養素
    const NUTRIENT_BATCH = 200;
    for (let j = 0; j < nutrientRows.length; j += NUTRIENT_BATCH) {
      await db.insert(foodNutrients).values(nutrientRows.slice(j, j + NUTRIENT_BATCH));
    }

    inserted += insertedFoods.length;
    foodBuffer = [];
    nutrientBuffer = [];
  }

  for (let i = 0; i < newItems.length; i += FETCH_BATCH) {
    const batch = newItems.slice(i, i + FETCH_BATCH);

    const results = await Promise.allSettled(
      batch.map((item) => fetchProductDetail(item.cmno))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const item = batch[j];
      fetched++;

      if (result.status !== "fulfilled" || result.value.length === 0) {
        fetchErrors++;
        process.stdout.write(`  x ${item.name}\n`);
        continue;
      }

      const detail = result.value[0];
      const { calories, servingSize, servingUnit } = parseNote(detail.NOTE);

      if (calories === null) {
        noCalories++;
        continue;
      }

      const nutrients = parseNutrients(detail.NUTRIENTS?.[0]);

      foodBuffer.push({
        name: detail.PRODNAME,
        brand: "全家 FamilyMart",
        source: "family",
        sourceId: detail.CMNO,
        servingSize: String(servingSize ?? 1),
        servingUnit,
        calories: String(calories),
        isVerified: false,
        isPublic: true,
        metadata: {
          imageUrl: `${PROD_IMG_URL}${detail.PROD_PIC}`,
          externalUrl: `${EXTERNAL_URL_BASE}${detail.CMNO}`,
          allergens: detail.ANAPHY ?? [],
          vendor: detail.VEND_DESC ?? "",
          note: detail.NOTE,
          category: detail.CATEGORY_NAME,
        },
      });
      nutrientBuffer.push({ nutrients, sourceId: detail.CMNO });

      // 達到批次大小就寫入
      if (foodBuffer.length >= DB_BATCH) {
        await flushBuffer();
      }
    }

    process.stdout.write(`  [${Math.min(fetched, newItems.length)}/${newItems.length}] 已爬取，${inserted} 已寫入 DB\r`);

    if (i + FETCH_BATCH < newItems.length) {
      await sleep(DELAY_MS);
    }
  }

  // 寫入剩餘的
  await flushBuffer();

  console.log(`\n\n========================================`);
  console.log(`同步完成！`);
  console.log(`  新增寫入 DB：${inserted} 項`);
  console.log(`  無熱量跳過：${noCalories} 項`);
  console.log(`  請求失敗：${fetchErrors} 項`);
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
