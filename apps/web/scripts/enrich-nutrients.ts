/**
 * 通用營養素 LLM 估算腳本
 * 使用 MiniMax M2.5 根據商品名稱、分類、熱量來估算巨量營養素
 * 支援所有 food source（seven, family, etc.）
 *
 * 用法：
 *   source .env.local && DATABASE_URL=$DATABASE_URL MINIMAX_API_KEY=$MINIMAX_API_KEY pnpm enrich -- --source seven
 *   source .env.local && DATABASE_URL=$DATABASE_URL MINIMAX_API_KEY=$MINIMAX_API_KEY pnpm enrich -- --source family
 *   source .env.local && DATABASE_URL=$DATABASE_URL MINIMAX_API_KEY=$MINIMAX_API_KEY pnpm enrich -- --source family --dry-run
 *   source .env.local && DATABASE_URL=$DATABASE_URL MINIMAX_API_KEY=$MINIMAX_API_KEY pnpm enrich -- --source seven --limit 10
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { foods, foodNutrients, nutrientDefinitions } from "../src/server/db/schema";

// ---------- Config ----------

const MINIMAX_API_URL = "https://api.minimax.io/v1/text/chatcompletion_v2";
const MINIMAX_MODEL = "MiniMax-M2.5";
const BATCH_SIZE = 25;
const DELAY_MS = 2000;
const MAX_RETRIES = 3;

const SOURCE_LABELS: Record<string, string> = {
  seven: "7-ELEVEN",
  family: "全家 FamilyMart",
  usda: "USDA",
  openfoodfacts: "Open Food Facts",
  user: "使用者自建",
};

const SYSTEM_PROMPT = `你是一位台灣食品營養分析專家。我會給你一批台灣便利商店/超市的食品資料（名稱、品牌、分類、已知熱量），請你根據你對台灣食品的了解，估算每項商品的巨量營養素。

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
   - 飲料：碳水為主（糖），蛋白質/脂肪極低
3. 鈉通常在 300-1000mg 之間（鹹食偏高，甜食偏低，飲料 0-50mg）
4. 如果有備註提到特定食材（如牛肉、雞肉），請據此調整蛋白質估算
5. 數值精確到小數點後一位
6. 回覆格式為 JSON array，每個元素包含 index（對應輸入順序）和營養素

回傳嚴格的 JSON array 格式，不要有任何其他文字。每個元素格式：
{"index": 0, "proteinG": 10.0, "fatG": 5.0, "carbsG": 30.0, "saturatedFatG": 2.0, "sugarG": 5.0, "sodiumMg": 300, "fiberG": 2.0}
可選欄位（saturatedFatG, sugarG, sodiumMg, fiberG）如果無法估算可以設為 null。`;

const NUTRIENT_FIELD_MAP: Record<string, string> = {
  proteinG: "Protein",
  fatG: "Total Fat",
  carbsG: "Total Carbohydrate",
  saturatedFatG: "Saturated Fat",
  sugarG: "Total Sugars",
  sodiumMg: "Sodium",
  fiberG: "Dietary Fiber",
};

// ---------- Types ----------

interface FoodRow {
  id: string;
  name: string;
  brand: string | null;
  calories: string;
  metadata: {
    category?: string;
    note?: string;
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
  const sourceIdx = args.indexOf("--source");
  const source = sourceIdx !== -1 ? args[sourceIdx + 1] : null;

  if (!source) {
    console.error("ERROR: 請指定 --source (seven, family, ...)");
    console.error("用法: pnpm enrich -- --source seven");
    process.exit(1);
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    console.error("ERROR: MINIMAX_API_KEY 未設定");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL 未設定");
    process.exit(1);
  }

  const label = SOURCE_LABELS[source] ?? source;
  console.log(`=== ${label} 營養素 LLM 估算 ===\n`);

  const client = postgres(connectionString);
  const db = drizzle(client);

  // 1. Load nutrient definitions
  const allNutrientDefs = await db.select().from(nutrientDefinitions);
  const nutrientMap = new Map<string, number>();
  allNutrientDefs.forEach((n) => nutrientMap.set(n.name, n.id));

  // 2. Find foods WITHOUT nutrients
  console.log(`1. 查詢尚未有營養素的 ${label} 商品...`);
  const allFoods = await db
    .select({
      id: foods.id,
      name: foods.name,
      brand: foods.brand,
      calories: foods.calories,
      metadata: foods.metadata,
    })
    .from(foods)
    .where(eq(foods.source, source as any)) as FoodRow[];

  const foodsWithNutrients = await db
    .select({ foodId: foodNutrients.foodId })
    .from(foodNutrients)
    .innerJoin(foods, eq(foods.id, foodNutrients.foodId))
    .where(eq(foods.source, source as any))
    .groupBy(foodNutrients.foodId);

  const hasNutrients = new Set(foodsWithNutrients.map((r) => r.foodId));
  const toEnrich = allFoods
    .filter((f) => !hasNutrients.has(f.id))
    .slice(0, limit);

  console.log(`   DB 中 ${allFoods.length} 項 ${label} 商品`);
  console.log(`   已有營養素：${hasNutrients.size} 項`);
  console.log(`   待估算：${toEnrich.length} 項\n`);

  if (toEnrich.length === 0) {
    console.log("所有商品都已有營養素！");
    await client.end();
    process.exit(0);
  }

  // 3. MiniMax API helper
  async function callMiniMax(prompt: string): Promise<string> {
    const response = await fetch(MINIMAX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MiniMax API ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    if (result.base_resp?.status_code !== 0) {
      throw new Error(`MiniMax error: ${result.base_resp?.status_msg || "unknown"}`);
    }

    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("MiniMax returned empty content");
    return content;
  }

  // 4. Process in batches
  console.log(`2. 使用 MiniMax M2.5 估算營養素（每批 ${BATCH_SIZE} 項）...\n`);

  let enriched = 0;
  let errors = 0;

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toEnrich.length / BATCH_SIZE);

    const foodList = batch
      .map((f, idx) => {
        const meta = f.metadata;
        const category = meta?.category ?? "未分類";
        const note = meta?.note ?? "";
        const brand = f.brand ?? label;
        return `${idx}. 「${f.name}」 品牌: ${brand}，分類: ${category}，熱量: ${f.calories} kcal${note ? `，備註: ${note}` : ""}`;
      })
      .join("\n");

    const prompt = `以下是 ${batch.length} 項「${label}」的商品，請估算每項的營養素：\n\n${foodList}`;

    let lastError: unknown;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        if (retry > 0) {
          const waitSec = Math.pow(2, retry) * 15;
          console.log(`\n  ⏳ 等待 ${waitSec}s 後重試 (${retry}/${MAX_RETRIES})...`);
          await sleep(waitSec * 1000);
        }

        const raw = await callMiniMax(prompt);
        // Handle potential markdown code blocks
        let text = raw.trim();
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) text = jsonMatch[1].trim();

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
        break;
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
