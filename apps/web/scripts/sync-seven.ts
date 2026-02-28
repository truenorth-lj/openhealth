/**
 * 7-ELEVEN 鮮食同步腳本
 * 從 7-11.com.tw/freshfoods 爬取食品資料，直接寫入 DB
 * 已存在的商品（以 source + sourceId 判斷）會跳過，不會重複
 *
 * 用法：
 *   source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:seven
 *   source .env.local && DATABASE_URL=$DATABASE_URL pnpm sync:seven -- --dry-run
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { foods, nutrientDefinitions } from "../src/server/db/schema";

const BASE_URL = "https://www.7-11.com.tw/freshfoods";

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

// ---------- XML Parser ----------

function parseItems(xml: string, category: string, folder: string) {
  const items: { name: string; kcal: number; sourceId: string; imageUrl: string; price: number; category: string; note: string | null }[] = [];
  const itemRegex = /<Item[^>]*>([\s\S]*?)<\/Item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1].trim() : "";
    };

    const kcal = parseInt(get("kcal"), 10);
    if (isNaN(kcal) || kcal <= 0) continue;

    const image = get("image");
    const imageId = image.replace(/^images\//, "").replace(/\.png$/, "");

    items.push({
      name: get("name"),
      kcal,
      sourceId: `7eleven-${imageId}`,
      imageUrl: `${BASE_URL}/${folder}/${image}`,
      price: parseInt(get("price"), 10) || 0,
      category,
      note: get("content") || null,
    });
  }

  return items;
}

// ---------- Main ----------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const dryRun = args.includes("--dry-run");

  console.log("=== 7-ELEVEN 鮮食同步 ===\n");

  // Step 1: Fetch all categories
  console.log("1. 爬取商品列表...");
  type ParsedItem = ReturnType<typeof parseItems>[number];
  const allItems: ParsedItem[] = [];

  for (const cat of CATEGORIES) {
    try {
      const res = await fetch(`${BASE_URL}/read_food_xml.aspx?=${cat.index}`);
      const xml = await res.text();
      const items = parseItems(xml, cat.name, cat.folder);
      allItems.push(...items);
      process.stdout.write(`  [${cat.name}] ${items.length} 項\n`);
    } catch (err) {
      process.stdout.write(`  [${cat.name}] 失敗\n`);
    }
    await sleep(200);
  }

  console.log(`\n  共 ${allItems.length} 項有熱量資料\n`);

  // Step 2: Connect DB, check existing
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL 未設定");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("2. 查詢 DB 中已存在的 7-ELEVEN 商品...");
  const existingRows = await db
    .select({ sourceId: foods.sourceId })
    .from(foods)
    .where(eq(foods.source, "seven"));
  const existingIds = new Set(existingRows.map((r) => r.sourceId));
  console.log(`   DB 中已有 ${existingIds.size} 項\n`);

  const newItems = allItems.filter((item) => !existingIds.has(item.sourceId));
  console.log(`   需要新增：${newItems.length} 項（跳過 ${allItems.length - newItems.length} 項已存在）\n`);

  if (newItems.length === 0) {
    console.log("沒有新商品需要同步，已是最新！");
    await client.end();
    process.exit(0);
  }

  if (dryRun) {
    console.log("[DRY RUN] 新商品：");
    for (const item of newItems.slice(0, 20)) {
      console.log(`  - ${item.name} (${item.kcal} kcal)`);
    }
    if (newItems.length > 20) console.log(`  ... 還有 ${newItems.length - 20} 項`);
    await client.end();
    process.exit(0);
  }

  // Step 3: Batch insert
  console.log("3. 寫入 DB...\n");
  const BATCH = 50;
  let inserted = 0;

  for (let i = 0; i < newItems.length; i += BATCH) {
    const batch = newItems.slice(i, i + BATCH);
    await db.insert(foods).values(
      batch.map((item) => ({
        name: item.name,
        brand: "7-ELEVEN",
        source: "seven" as const,
        sourceId: item.sourceId,
        servingSize: "1",
        servingUnit: "份",
        calories: String(item.kcal),
        isVerified: false,
        isPublic: true,
        metadata: {
          imageUrl: item.imageUrl,
          externalUrl: `${BASE_URL}/hot.aspx`,
          price: item.price,
          category: item.category,
          note: item.note,
        },
      }))
    );
    inserted += batch.length;
    process.stdout.write(`  ${inserted}/${newItems.length} 已寫入\r`);
  }

  console.log(`\n\n========================================`);
  console.log(`同步完成！`);
  console.log(`  新增：${inserted} 項`);
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
