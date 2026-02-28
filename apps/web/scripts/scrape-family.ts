/**
 * 全家便利商店食品資料爬蟲
 * 從 foodsafety.family.com.tw 爬取所有食品及營養資訊
 *
 * 用法：
 *   npx tsx scripts/scrape-family.ts              # 爬全部
 *   npx tsx scripts/scrape-family.ts --limit 10   # 只爬前 10 項（測試用）
 *
 * 輸出：
 *   scripts/output/family-foods.json      — 完整原始資料
 *   scripts/output/family-foods-slim.json  — 精簡版（適合匯入 DB）
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

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

// ---------- Types ----------

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
  SEQ: number;
  VEND_DESC: string;
  ADDR: string;
  TEL: string;
  CATEGORY_ID: string;
  CATEGORY_NAME: string;
  CMNO: string;
  PRODNAME: string;
  PROD_TYPE: string;
  NOTE: string | null;
  SHOW_MAP: string;
  PROD_PIC: string;
  NUTRIENTS: Nutrient[];
  ANAPHY: string[];
  AUTH_TYPE: string[];
  RASRC: { SOURCETYPE: string; SOURCE_NAME: string; COUNTRY: string }[];
}

/** 精簡格式，對應 DB schema */
interface SlimFood {
  sourceId: string;
  name: string;
  brand: string;
  source: "family";
  servingSize: number;
  servingUnit: string;
  calories: number;
  nutrients: Record<string, number>;
  metadata: {
    imageUrl: string;
    externalUrl: string;
    allergens: string[];
    vendor: string;
    note: string | null;
    category: string;
  };
}

// ---------- API helpers ----------

async function fetchProductList(): Promise<Category[]> {
  console.log("取得商品列表...");
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

// ---------- Parse helpers ----------

const SERVING_UNIT_MAP: Record<string, string> = {
  公克: "g",
  公升: "L",
  毫升: "ml",
};

function parseNote(note: string | null): {
  calories: number | null;
  servingSizeNum: number | null;
  servingUnit: string;
} {
  if (!note) return { calories: null, servingSizeNum: null, servingUnit: "份" };

  const calMatch = note.match(/熱量(\d+(?:\.\d+)?)\s*大卡/);
  const servingMatch = note.match(/每份規格(\d+(?:\.\d+)?)\s*(公克|公升|毫升)/);

  return {
    calories: calMatch ? parseFloat(calMatch[1]) : null,
    servingSizeNum: servingMatch ? parseFloat(servingMatch[1]) : null,
    servingUnit: servingMatch
      ? SERVING_UNIT_MAP[servingMatch[2]] || servingMatch[2]
      : "份",
  };
}

function toSlimFood(detail: ProductDetail): SlimFood | null {
  const nutrient = detail.NUTRIENTS?.[0];
  const { calories, servingSizeNum, servingUnit } = parseNote(detail.NOTE);

  // 沒有熱量資料的跳過
  if (calories === null) return null;

  const isNum = (v: unknown): v is number => typeof v === "number" && !isNaN(v);
  const nutrients: Record<string, number> = {};
  if (nutrient) {
    if (isNum(nutrient.PROTEIN)) nutrients["Protein"] = nutrient.PROTEIN;
    if (isNum(nutrient.TOTALFAT)) nutrients["Total Fat"] = nutrient.TOTALFAT;
    if (isNum(nutrient.SATFAT)) nutrients["Saturated Fat"] = nutrient.SATFAT;
    if (isNum(nutrient.TRANSFAT)) nutrients["Trans Fat"] = nutrient.TRANSFAT;
    if (isNum(nutrient.CARBOHYDRATE)) nutrients["Total Carbohydrate"] = nutrient.CARBOHYDRATE;
    if (isNum(nutrient.SODIUM)) nutrients["Sodium"] = nutrient.SODIUM;
    if (isNum(nutrient.SUGAR)) nutrients["Total Sugars"] = nutrient.SUGAR;
    if (isNum(nutrient.CAFFEINE)) nutrients["Caffeine"] = nutrient.CAFFEINE;
  }

  return {
    sourceId: detail.CMNO,
    name: detail.PRODNAME,
    brand: "全家 FamilyMart",
    source: "family",
    servingSize: servingSizeNum ?? 1,
    servingUnit,
    calories,
    nutrients,
    metadata: {
      imageUrl: `${PROD_IMG_URL}${detail.PROD_PIC}`,
      externalUrl: `${EXTERNAL_URL_BASE}${detail.CMNO}`,
      allergens: detail.ANAPHY ?? [],
      vendor: detail.VEND_DESC ?? "",
      note: detail.NOTE,
      category: detail.CATEGORY_NAME,
    },
  };
}

// ---------- Main ----------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

  const outputDir = join(new URL(".", import.meta.url).pathname, "output");
  mkdirSync(outputDir, { recursive: true });

  // Step 1: 取得所有商品列表
  const categories = await fetchProductList();
  const allItems: { cmno: string; name: string; category: string }[] = [];

  for (const cat of categories) {
    for (const item of cat.ITEM) {
      allItems.push({
        cmno: item.CMNO,
        name: item.PRODNAME,
        category: cat.CATEGORY_NAME,
      });
    }
  }

  const itemsToFetch = allItems.slice(0, limit);
  console.log(`共 ${allItems.length} 項商品，本次爬取 ${itemsToFetch.length} 項\n`);

  // Step 2: 逐一取得商品詳情
  const fullDetails: ProductDetail[] = [];
  const slimFoods: SlimFood[] = [];
  const errors: { cmno: string; name: string; error: string }[] = [];

  const BATCH_SIZE = 5;
  const DELAY_MS = 300;

  for (let i = 0; i < itemsToFetch.length; i += BATCH_SIZE) {
    const batch = itemsToFetch.slice(i, i + BATCH_SIZE);
    const progress = `[${i + 1}-${Math.min(i + BATCH_SIZE, itemsToFetch.length)}/${itemsToFetch.length}]`;

    const results = await Promise.allSettled(
      batch.map((item) => fetchProductDetail(item.cmno))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const item = batch[j];

      if (result.status === "fulfilled" && result.value.length > 0) {
        const detail = result.value[0];
        fullDetails.push(detail);
        const slim = toSlimFood(detail);
        if (slim) {
          slimFoods.push(slim);
          process.stdout.write(`${progress} + ${item.name}\n`);
        } else {
          process.stdout.write(`${progress} ~ ${item.name} (no calories)\n`);
        }
      } else {
        const errMsg =
          result.status === "rejected"
            ? String(result.reason)
            : "empty response";
        errors.push({ cmno: item.cmno, name: item.name, error: errMsg });
        process.stdout.write(`${progress} x ${item.name}: ${errMsg}\n`);
      }
    }

    if (i + BATCH_SIZE < itemsToFetch.length) {
      await sleep(DELAY_MS);
    }
  }

  // Step 3: 寫入檔案
  const fullPath = join(outputDir, "family-foods.json");
  const slimPath = join(outputDir, "family-foods-slim.json");
  const errorPath = join(outputDir, "family-foods-errors.json");

  writeFileSync(fullPath, JSON.stringify(fullDetails, null, 2), "utf-8");
  writeFileSync(slimPath, JSON.stringify(slimFoods, null, 2), "utf-8");

  if (errors.length > 0) {
    writeFileSync(errorPath, JSON.stringify(errors, null, 2), "utf-8");
  }

  console.log(`\n========================================`);
  console.log(`完成！`);
  console.log(`  有營養資料：${slimFoods.length} 項`);
  console.log(`  無熱量跳過：${fullDetails.length - slimFoods.length} 項`);
  console.log(`  請求失敗：${errors.length} 項`);
  console.log(`  完整資料：${fullPath}`);
  console.log(`  精簡資料：${slimPath}`);
  console.log(`========================================`);

  // 印出前 3 筆精簡資料作為預覽
  if (slimFoods.length > 0) {
    console.log(`\n前 3 筆資料預覽：`);
    for (const food of slimFoods.slice(0, 3)) {
      console.log(`\n  ${food.name} (${food.brand})`);
      console.log(`    sourceId: ${food.sourceId}`);
      console.log(`    ${food.calories} kcal / ${food.servingSize}${food.servingUnit}`);
      console.log(`    P:${food.nutrients["Protein"]}g F:${food.nutrients["Total Fat"]}g C:${food.nutrients["Total Carbohydrate"]}g`);
      console.log(`    allergens: ${food.metadata.allergens.join(", ")}`);
      console.log(`    image: ${food.metadata.imageUrl}`);
      console.log(`    link: ${food.metadata.externalUrl}`);
    }
  }
}

main().catch(console.error);
