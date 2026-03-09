/**
 * 全家便利商店食品纖維補充腳本
 * 使用 MiniMax M2.5 根據食品名稱、分類、已知營養素來估算膳食纖維
 * 專門處理「有其他營養素但缺纖維」的食物
 *
 * 用法：
 *   source .env.local && DATABASE_URL=$DATABASE_URL MINIMAX_API_KEY=$MINIMAX_API_KEY pnpm enrich:fiber
 *   source .env.local && DATABASE_URL=$DATABASE_URL MINIMAX_API_KEY=$MINIMAX_API_KEY pnpm enrich:fiber -- --source seven
 *   source .env.local && DATABASE_URL=$DATABASE_URL MINIMAX_API_KEY=$MINIMAX_API_KEY pnpm enrich:fiber -- --dry-run
 *   source .env.local && DATABASE_URL=$DATABASE_URL MINIMAX_API_KEY=$MINIMAX_API_KEY pnpm enrich:fiber -- --limit 50
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, sql, notInArray, inArray } from "drizzle-orm";
import postgres from "postgres";
import { foods, foodNutrients, nutrientDefinitions } from "../src/server/db/schema";

// ---------- Config ----------

const MINIMAX_API_URL = "https://api.minimax.io/v1/text/chatcompletion_v2";
const MINIMAX_MODEL = "MiniMax-M2.5";
const BATCH_SIZE = 30;
const DELAY_MS = 2000;
const MAX_RETRIES = 3;

const SOURCE_LABELS: Record<string, string> = {
  seven: "7-ELEVEN",
  family: "全家 FamilyMart",
  getpower: "給力盒子 GET POWER",
  verified: "驗證品牌",
  usda: "USDA",
  openfoodfacts: "Open Food Facts",
  user: "使用者自建",
};

const SYSTEM_PROMPT = `你是一位台灣食品營養分析專家。我會給你一批台灣便利商店/超市的食品資料（名稱、品牌、分類、熱量、已知營養素），請你根據你對台灣食品的了解，估算每項商品的「膳食纖維」含量（g）。

重要規則：
1. 根據食品類型合理估算纖維：
   - 便當/飯類料理：通常 2-5g（有蔬菜配菜的偏高）
   - 沙拉/蔬菜類：通常 3-8g
   - 麵包/烘焙：通常 1-3g（全麥偏高 3-5g）
   - 飯糰/壽司：通常 1-3g
   - 飲料（茶、咖啡、果汁）：通常 0-1g
   - 牛奶/豆漿：通常 0-2g（豆漿偏高）
   - 甜點/冰品：通常 0-2g
   - 關東煮/湯品：通常 0-2g
   - 水果類：通常 2-5g
   - 堅果/穀物棒：通常 2-5g
2. 碳水高但糖也很高的食物（如甜飲、甜點），纖維通常很低
3. 碳水高但糖低的食物（如飯、麵），纖維通常中等
4. 蔬菜為主的食物纖維最高
5. 數值精確到小數點後一位
6. 如果真的無法判斷，給一個保守估算

回傳嚴格的 JSON array 格式，不要有任何其他文字。每個元素格式：
{"index": 0, "fiberG": 2.5}`;

// ---------- Types ----------

interface FoodWithNutrients {
  id: string;
  name: string;
  brand: string | null;
  calories: string;
  metadata: {
    category?: string;
    note?: string;
    [key: string]: unknown;
  } | null;
  protein?: number;
  fat?: number;
  carbs?: number;
  sugar?: number;
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
  const source = sourceIdx !== -1 ? args[sourceIdx + 1] : "family";

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
  console.log(`=== ${label} 膳食纖維補充 (MiniMax M2.5) ===\n`);

  const client = postgres(connectionString);
  const db = drizzle(client);

  // 1. Find ALL Dietary Fiber nutrient definition IDs (may have duplicates)
  const fiberDefs = await db
    .select({ id: nutrientDefinitions.id })
    .from(nutrientDefinitions)
    .where(eq(nutrientDefinitions.name, "Dietary Fiber"));

  const fiberIds = fiberDefs.map((d) => d.id);
  // Use the first one for inserting new records
  const fiberNutrientId = fiberIds[0];

  if (!fiberNutrientId) {
    console.error("ERROR: 找不到 Dietary Fiber 的 nutrient_definition");
    await client.end();
    process.exit(1);
  }

  console.log(`   Dietary Fiber nutrient IDs: [${fiberIds.join(", ")}] (寫入用 ID: ${fiberNutrientId})\n`);

  // 2. Find foods that have nutrients but are MISSING fiber
  console.log(`1. 查詢有營養素但缺纖維的 ${label} 商品...`);

  // Get food IDs that already have fiber (any of the fiber IDs)
  const foodsWithFiber = await db
    .select({ foodId: foodNutrients.foodId })
    .from(foodNutrients)
    .where(inArray(foodNutrients.nutrientId, fiberIds));
  const hasFiber = new Set(foodsWithFiber.map((r) => r.foodId));

  // Get food IDs that have at least one nutrient record
  const foodsWithAnyNutrient = await db
    .select({ foodId: foodNutrients.foodId })
    .from(foodNutrients)
    .innerJoin(foods, eq(foods.id, foodNutrients.foodId))
    .where(eq(foods.source, source as any))
    .groupBy(foodNutrients.foodId);
  const hasAnyNutrient = new Set(foodsWithAnyNutrient.map((r) => r.foodId));

  // Foods with nutrients but missing fiber
  const missingFiberIds = [...hasAnyNutrient].filter((id) => !hasFiber.has(id));

  console.log(`   有營養素的 ${label} 商品：${hasAnyNutrient.size} 項`);
  console.log(`   已有纖維：${hasAnyNutrient.size - missingFiberIds.length} 項`);
  console.log(`   缺纖維：${missingFiberIds.length} 項\n`);

  if (missingFiberIds.length === 0) {
    console.log("所有商品都已有纖維資料！");
    await client.end();
    process.exit(0);
  }

  // 3. Load food details + existing nutrients for missing ones
  const toProcess = missingFiberIds.slice(0, limit);

  // Load in chunks of 500 to avoid too-large IN clauses
  const CHUNK = 500;
  const allFoodRows: FoodWithNutrients[] = [];

  for (let c = 0; c < toProcess.length; c += CHUNK) {
    const chunk = toProcess.slice(c, c + CHUNK);

    const foodRows = await db
      .select({
        id: foods.id,
        name: foods.name,
        brand: foods.brand,
        calories: foods.calories,
        metadata: foods.metadata,
      })
      .from(foods)
      .where(inArray(foods.id, chunk));

    // Load existing nutrients for these foods
    const existingNutrients = await db
      .select({
        foodId: foodNutrients.foodId,
        name: nutrientDefinitions.name,
        amount: foodNutrients.amount,
      })
      .from(foodNutrients)
      .innerJoin(nutrientDefinitions, eq(foodNutrients.nutrientId, nutrientDefinitions.id))
      .where(inArray(foodNutrients.foodId, chunk));

    const nutrientsByFood = new Map<string, Record<string, number>>();
    for (const n of existingNutrients) {
      if (!nutrientsByFood.has(n.foodId)) nutrientsByFood.set(n.foodId, {});
      nutrientsByFood.get(n.foodId)![n.name] = Number(n.amount);
    }

    for (const f of foodRows) {
      const n = nutrientsByFood.get(f.id) ?? {};
      allFoodRows.push({
        ...f,
        metadata: f.metadata as FoodWithNutrients["metadata"],
        protein: n["Protein"],
        fat: n["Total Fat"],
        carbs: n["Total Carbohydrate"],
        sugar: n["Total Sugars"],
      });
    }
  }

  console.log(`   待處理：${allFoodRows.length} 項\n`);

  // 4. MiniMax API helper
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
        max_tokens: 4096,
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

  // 5. Process in batches
  console.log(`2. 使用 MiniMax M2.5 估算纖維（每批 ${BATCH_SIZE} 項）...\n`);

  let enriched = 0;
  let errors = 0;

  for (let i = 0; i < allFoodRows.length; i += BATCH_SIZE) {
    const batch = allFoodRows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allFoodRows.length / BATCH_SIZE);

    const foodList = batch
      .map((f, idx) => {
        const meta = f.metadata;
        const category = meta?.category ?? "未分類";
        const parts = [
          `${idx}. 「${f.name}」`,
          `品牌: ${f.brand ?? label}`,
          `分類: ${category}`,
          `熱量: ${f.calories} kcal`,
        ];
        if (f.protein != null) parts.push(`蛋白質: ${f.protein}g`);
        if (f.fat != null) parts.push(`脂肪: ${f.fat}g`);
        if (f.carbs != null) parts.push(`碳水: ${f.carbs}g`);
        if (f.sugar != null) parts.push(`糖: ${f.sugar}g`);
        return parts.join("，");
      })
      .join("\n");

    const prompt = `以下是 ${batch.length} 項「${label}」的商品，請估算每項的膳食纖維含量（g）：\n\n${foodList}`;

    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        if (retry > 0) {
          const waitSec = Math.pow(2, retry) * 15;
          console.log(`\n  等待 ${waitSec}s 後重試 (${retry}/${MAX_RETRIES})...`);
          await sleep(waitSec * 1000);
        }

        const raw = await callMiniMax(prompt);
        let text = raw.trim();
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) text = jsonMatch[1].trim();

        const estimates: Array<{ index: number; fiberG: number }> = JSON.parse(text);

        if (dryRun) {
          for (const est of estimates) {
            const food = batch[est.index];
            if (!food) continue;
            console.log(`  ${food.name} (${food.calories} kcal, C:${food.carbs ?? "?"}g S:${food.sugar ?? "?"}g) → 纖維: ${est.fiberG}g`);
          }
          console.log();
        } else {
          const rows: { foodId: string; nutrientId: number; amount: string }[] = [];
          for (const est of estimates) {
            const food = batch[est.index];
            if (!food) continue;
            if (typeof est.fiberG !== "number" || isNaN(est.fiberG)) continue;
            rows.push({ foodId: food.id, nutrientId: fiberNutrientId, amount: String(est.fiberG) });
          }

          if (rows.length > 0) {
            await db.insert(foodNutrients).values(rows).onConflictDoNothing();
            enriched += rows.length;
          }
        }

        process.stdout.write(`  [${batchNum}/${totalBatches}] ${Math.min(i + BATCH_SIZE, allFoodRows.length)}/${allFoodRows.length} 已處理\r`);
        break;
      } catch (err) {
        const is429 = String(err).includes("429") || String(err).includes("Too Many Requests");
        if (!is429 || retry === MAX_RETRIES) {
          errors++;
          console.error(`\n  批次 ${batchNum} 失敗: ${err}`);
          break;
        }
      }
    }

    if (i + BATCH_SIZE < allFoodRows.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n\n========================================`);
  if (dryRun) {
    console.log(`[DRY RUN] 預覽完成，未寫入 DB`);
  } else {
    console.log(`纖維補充完成！`);
    console.log(`  已補充纖維：${enriched} 項`);
    console.log(`  失敗：${errors} 批`);
  }
  console.log(`========================================`);

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("纖維補充失敗:", err);
  process.exit(1);
});
