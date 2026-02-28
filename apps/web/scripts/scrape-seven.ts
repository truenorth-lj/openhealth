/**
 * 7-ELEVEN 鮮食資料爬蟲
 * 從 7-11.com.tw/freshfoods 爬取所有食品及營養資訊
 *
 * ⚠️ 注意：7-11 的 XML 只提供熱量（kcal），沒有蛋白質/脂肪/碳水等巨量營養素
 *    全家的 API 則有完整的營養成分（蛋白質、脂肪、飽和脂肪、反式脂肪、碳水、鈉、糖、咖啡因）
 *
 * 用法：
 *   npx tsx scripts/scrape-seven.ts              # 爬全部
 *   npx tsx scripts/scrape-seven.ts --limit 10   # 只爬前 10 項（測試用）
 *
 * 輸出：
 *   scripts/output/seven-foods.json      — 完整資料
 *   scripts/output/seven-foods-slim.json  — 精簡版（適合匯入 DB）
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const BASE_URL = "https://www.7-11.com.tw/freshfoods";

// Category index → { name, folder } mapping
// Derived from 7-11 freshfoods page source
const CATEGORIES: { index: number; name: string; folder: string }[] = [
  { index: 0, name: "御飯糰", folder: "1_Ricerolls" },
  { index: 1, name: "光合蔬果沙拉", folder: "2_Light" },
  { index: 2, name: "台式料理", folder: "3_Cuisine" },
  { index: 3, name: "風味小食", folder: "4_Snacks" },
  { index: 4, name: "異國料理", folder: "5_ForeignDishes" },
  { index: 5, name: "麵食", folder: "6_Noodles" },
  { index: 6, name: "關東煮", folder: "7_Oden" },
  { index: 7, name: "大亨堡", folder: "8_Bigbite" },
  { index: 10, name: "麵包甜品", folder: "11_bread" },
  { index: 12, name: "現蒸地瓜", folder: "12_steam" },
  { index: 13, name: "御料小館", folder: "13_luwei" },
  { index: 14, name: "健康食品", folder: "15_health" },
  { index: 15, name: "原賞", folder: "16_sandwich" },
  { index: 16, name: "Ohlala", folder: "17_ohlala" },
  { index: 17, name: "天素地蔬", folder: "18_veg" },
  { index: 18, name: "星級饗宴", folder: "19_star" },
  { index: 19, name: "Panini", folder: "20_panini" },
  { index: 21, name: "霜淇淋", folder: "22_ice" },
];

// ---------- Types ----------

interface RawItem {
  name: string;
  kcal: string;
  price: string;
  image: string;
  content: string;
  isNew: boolean;
  specialSale: boolean;
  category: string;
  categoryFolder: string;
}

interface SlimFood {
  sourceId: string;
  name: string;
  brand: string;
  source: "seven";
  servingSize: number;
  servingUnit: string;
  calories: number;
  nutrients: Record<string, number>;
  metadata: {
    imageUrl: string;
    externalUrl: string;
    price: number;
    category: string;
    note: string | null;
  };
}

// ---------- XML Parser (simple regex-based, no deps) ----------

function parseItems(xml: string, category: string, folder: string): RawItem[] {
  const items: RawItem[] = [];
  const itemRegex = /<Item[^>]*>([\s\S]*?)<\/Item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1].trim() : "";
    };

    items.push({
      name: get("name"),
      kcal: get("kcal"),
      price: get("price"),
      image: get("image"),
      content: get("content"),
      isNew: get("new") === "True",
      specialSale: get("special_sale") === "True",
      category,
      categoryFolder: folder,
    });
  }

  return items;
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

  console.log("=== 7-ELEVEN 鮮食資料爬蟲 ===\n");

  // Step 1: Fetch all categories
  const allRawItems: RawItem[] = [];

  for (const cat of CATEGORIES) {
    const url = `${BASE_URL}/read_food_xml.aspx?=${cat.index}`;
    try {
      const res = await fetch(url);
      const xml = await res.text();
      const items = parseItems(xml, cat.name, cat.folder);
      allRawItems.push(...items);
      console.log(`  [${cat.name}] ${items.length} 項`);
    } catch (err) {
      console.error(`  [${cat.name}] 失敗: ${err}`);
    }
    await sleep(200);
  }

  console.log(`\n共 ${allRawItems.length} 項商品\n`);

  // Step 2: Convert to slim format
  const itemsToProcess = allRawItems.slice(0, limit);
  const slimFoods: SlimFood[] = [];
  const noCalories: string[] = [];

  for (const item of itemsToProcess) {
    const kcal = parseInt(item.kcal, 10);
    if (isNaN(kcal) || kcal <= 0) {
      noCalories.push(item.name);
      continue;
    }

    // Generate a stable sourceId from name (7-11 doesn't have product IDs)
    // Use image filename as a more stable identifier
    const imageId = item.image.replace(/^images\//, "").replace(/\.png$/, "");
    const sourceId = `7eleven-${imageId}`;

    const imageUrl = `${BASE_URL}/${item.categoryFolder}/${item.image}`;

    slimFoods.push({
      sourceId,
      name: item.name,
      brand: "7-ELEVEN",
      source: "seven",
      servingSize: 1,
      servingUnit: "份",
      calories: kcal,
      nutrients: {}, // 7-11 不提供巨量營養素
      metadata: {
        imageUrl,
        externalUrl: `${BASE_URL}/hot.aspx`,
        price: parseInt(item.price, 10) || 0,
        category: item.category,
        note: item.content || null,
      },
    });
  }

  // Step 3: Write files
  const fullPath = join(outputDir, "seven-foods.json");
  const slimPath = join(outputDir, "seven-foods-slim.json");

  writeFileSync(fullPath, JSON.stringify(allRawItems, null, 2), "utf-8");
  writeFileSync(slimPath, JSON.stringify(slimFoods, null, 2), "utf-8");

  console.log(`========================================`);
  console.log(`完成！`);
  console.log(`  有熱量資料：${slimFoods.length} 項`);
  console.log(`  無熱量跳過：${noCalories.length} 項`);
  console.log(`  完整資料：${fullPath}`);
  console.log(`  精簡資料：${slimPath}`);
  console.log(`========================================`);

  // Preview
  if (slimFoods.length > 0) {
    console.log(`\n前 5 筆資料預覽：`);
    for (const food of slimFoods.slice(0, 5)) {
      console.log(`\n  ${food.name} (${food.metadata.category})`);
      console.log(`    ${food.calories} kcal / $${food.metadata.price}`);
      console.log(`    sourceId: ${food.sourceId}`);
      console.log(`    image: ${food.metadata.imageUrl}`);
    }
  }
}

main().catch(console.error);
