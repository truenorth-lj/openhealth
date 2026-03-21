/**
 * 7-ELEVEN 營養素估算腳本
 * 使用 Gemini LLM 根據商品名稱、分類、熱量來估算巨量營養素
 * 然後寫入 DB 的 food_nutrients 表
 *
 * 用法：
 *   source .env.local && DATABASE_URL=$DATABASE_URL GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY pnpm enrich:seven
 *   source .env.local && DATABASE_URL=$DATABASE_URL GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY pnpm enrich:seven -- --dry-run
 *   source .env.local && DATABASE_URL=$DATABASE_URL GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY pnpm enrich:seven -- --limit 10
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, sql } from "drizzle-orm";
import postgres from "postgres";
import { foods, foodNutrients, nutrientDefinitions } from "../src/server/db/schema";

// ---------- Gemini Setup ----------

const BATCH_SIZE = 25; // items per LLM call (larger = fewer API calls)
const DELAY_MS = 4000; // delay between calls
const MAX_RETRIES = 3; // retry on rate limit

const responseSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      index: { type: SchemaType.NUMBER, description: "商品在輸入列表中的索引 (0-based)" },
      proteinG: { type: SchemaType.NUMBER, description: "蛋白質 g" },
      fatG: { type: SchemaType.NUMBER, description: "脂肪 g" },
      carbsG: { type: SchemaType.NUMBER, description: "碳水化合物 g" },
      saturatedFatG: { type: SchemaType.NUMBER, description: "飽和脂肪 g", nullable: true },
      sugarG: { type: SchemaType.NUMBER, description: "糖 g", nullable: true },
      sodiumMg: { type: SchemaType.NUMBER, description: "鈉 mg", nullable: true },
      fiberG: { type: SchemaType.NUMBER, description: "膳食纖維 g", nullable: true },
    },
    required: ["index", "proteinG", "fatG", "carbsG"],
  },
};

const SYSTEM_PROMPT = `你是一位台灣食品營養分析專家。我會給你一批 7-ELEVEN 便利商店的鮮食商品資料（名稱、分類、已知熱量），請你根據你對台灣便利商店鮮食的了解，估算每項商品的巨量營養素。

重要規則：
1. 估算值必須合理：蛋白質×4 + 脂肪×9 + 碳水×4 ≈ 已知熱量（允許 ±15% 誤差）
2. 根據食品類型合理分配：
   - 飯糰/壽司：碳水為主（50-60%），蛋白質中等（15-20%），脂肪低
   - 便當/料理：碳水為主（40-50%），蛋白質中等，脂肪中等
   - 麵包/甜品：碳水高（55-65%），脂肪中等，蛋白質低
   - 沙拉：碳水低，蛋白質中等，脂肪中等
   - 大亨堡/熱狗：蛋白質中（20-25%），脂肪高（35-45%），碳水中
   - 關東煮：蛋白質高（25-35%），脂肪中等，碳水低-中
   - 霜淇淋/冰品：碳水高（50-60%），脂肪高（30-40%），蛋白質低
3. 鈉通常在 300-1000mg 之間（鹹食偏高，甜食偏低）
4. 如果有 content 欄位提到特定食材（如牛肉、雞肉），請據此調整蛋白質估算
5. 數值精確到小數點後一位
6. 回覆格式為 JSON array，每個元素包含 index（對應輸入順序）和營養素

以 JSON array 格式回傳結果。`;

// ---------- Types ----------

interface SevenFood {
  id: string;
  name: string;
  calories: string;
  metadata: {
    category?: string;
    note?: string;
    price?: number;
    [key: string]: unknown;
  } | null;
}

// ---------- Main ----------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_AI_API_KEY 未設定");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL 未設定");
    process.exit(1);
  }

  console.log("=== 7-ELEVEN 營養素 LLM 估算 ===\n");

  const client = postgres(connectionString);
  const db = drizzle(client);

  // 1. Load nutrient definitions
  const allNutrientDefs = await db.select().from(nutrientDefinitions);
  const nutrientMap = new Map<string, number>();
  allNutrientDefs.forEach((n) => nutrientMap.set(n.name, n.id));

  const NUTRIENT_FIELD_MAP: Record<string, string> = {
    proteinG: "Protein",
    fatG: "Total Fat",
    carbsG: "Total Carbohydrate",
    saturatedFatG: "Saturated Fat",
    sugarG: "Total Sugars",
    sodiumMg: "Sodium",
    fiberG: "Dietary Fiber",
  };

  // 2. Find 7-ELEVEN foods WITHOUT nutrients
  console.log("1. 查詢尚未有營養素的 7-ELEVEN 商品...");
  const sevenFoodsAll = await db
    .select({
      id: foods.id,
      name: foods.name,
      calories: foods.calories,
      metadata: foods.metadata,
    })
    .from(foods)
    .where(eq(foods.source, "seven")) as SevenFood[];

  // Check which already have nutrients
  const foodsWithNutrients = await db
    .select({ foodId: foodNutrients.foodId })
    .from(foodNutrients)
    .innerJoin(foods, eq(foods.id, foodNutrients.foodId))
    .where(eq(foods.source, "seven"))
    .groupBy(foodNutrients.foodId);

  const hasNutrients = new Set(foodsWithNutrients.map((r) => r.foodId));
  const toEnrich = sevenFoodsAll
    .filter((f) => !hasNutrients.has(f.id))
    .slice(0, limit);

  console.log(`   DB 中 ${sevenFoodsAll.length} 項 7-ELEVEN 商品`);
  console.log(`   已有營養素：${hasNutrients.size} 項`);
  console.log(`   待估算：${toEnrich.length} 項\n`);

  if (toEnrich.length === 0) {
    console.log("所有商品都已有營養素！");
    await client.end();
    process.exit(0);
  }

  // 3. Setup Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite", // lite 版額度較高；可改為 gemini-2.5-flash 品質更好
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  // 4. Process in batches
  console.log(`2. 使用 Gemini 估算營養素（每批 ${BATCH_SIZE} 項）...\n`);

  let enriched = 0;
  let errors = 0;

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toEnrich.length / BATCH_SIZE);

    // Build prompt
    const foodList = batch
      .map((f, idx) => {
        const meta = f.metadata;
        const category = meta?.category ?? "未分類";
        const note = meta?.note ?? "";
        return `${idx}. 「${f.name}」 分類: ${category}，熱量: ${f.calories} kcal${note ? `，備註: ${note}` : ""}`;
      })
      .join("\n");

    const prompt = `以下是 ${batch.length} 項 7-ELEVEN 便利商店商品，請估算每項的營養素：\n\n${foodList}`;

    // Retry with exponential backoff on rate limit
    let lastError: unknown;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        if (retry > 0) {
          const waitSec = Math.pow(2, retry) * 15; // 30s, 60s, 120s
          console.log(`\n  ⏳ 等待 ${waitSec}s 後重試 (${retry}/${MAX_RETRIES})...`);
          await sleep(waitSec * 1000);
        }

        const result = await model.generateContent([
          { text: SYSTEM_PROMPT },
          { text: prompt },
        ]);

        const text = result.response.text();
        const estimates: Array<{
          index: number;
          proteinG: number;
          fatG: number;
          carbsG: number;
          saturatedFatG?: number | null;
          sugarG?: number | null;
          sodiumMg?: number | null;
          fiberG?: number | null;
        }> = JSON.parse(text);

        if (dryRun) {
          for (const est of estimates) {
            const food = batch[est.index];
            if (!food) continue;
            console.log(`  ${food.name} (${food.calories} kcal)`);
            console.log(`    P:${est.proteinG}g  F:${est.fatG}g  C:${est.carbsG}g`);
            const estimated = est.proteinG * 4 + est.fatG * 9 + est.carbsG * 4;
            const diff = Math.abs(estimated - Number(food.calories)) / Number(food.calories) * 100;
            console.log(`    估算熱量: ${estimated.toFixed(0)} kcal (誤差 ${diff.toFixed(1)}%)\n`);
          }
        } else {
          for (const est of estimates) {
            const food = batch[est.index];
            if (!food) continue;

            const rows: { foodId: string; nutrientId: number; amount: string }[] = [];
            for (const [field, nutrientName] of Object.entries(NUTRIENT_FIELD_MAP)) {
              const value = est[field as keyof typeof est];
              if (typeof value !== "number" || isNaN(value)) continue;
              const nutrientId = nutrientMap.get(nutrientName);
              if (!nutrientId) continue;
              rows.push({ foodId: food.id, nutrientId, amount: String(value) });
            }

            if (rows.length > 0) {
              await db.insert(foodNutrients).values(rows).onConflictDoNothing();
              enriched++;
            }
          }
        }

        process.stdout.write(`  [${batchNum}/${totalBatches}] ${Math.min(i + BATCH_SIZE, toEnrich.length)}/${toEnrich.length} 已處理\r`);
        lastError = null;
        break; // success
      } catch (err) {
        lastError = err;
        const is429 = String(err).includes("429") || String(err).includes("Too Many Requests");
        if (!is429 || retry === MAX_RETRIES) {
          errors++;
          console.error(`\n  批次 ${batchNum} 失敗: ${err}`);
          break;
        }
      }
    }

    if (i + BATCH_SIZE < toEnrich.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n\n========================================`);
  if (dryRun) {
    console.log(`[DRY RUN] 預覽完成，未寫入 DB`);
  } else {
    console.log(`估算完成！`);
    console.log(`  已補充營養素：${enriched} 項`);
    console.log(`  失敗：${errors} 批`);
  }
  console.log(`========================================`);

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("估算失敗:", err);
  process.exit(1);
});
