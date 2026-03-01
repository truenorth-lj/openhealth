/**
 * 回填日記紀錄的纖維值
 * 把 food_nutrients 中新補的纖維資料更新到已存在的 diary_entries
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL 未設定");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  // Backfill: update diary entries where fiber is 0/null but food now has fiber data
  // Multiply by serving_qty to get correct amount
  const result = await db.execute(sql`
    UPDATE diary_entries de
    SET fiber_g = (fn.amount::numeric * de.serving_qty::numeric)
    FROM food_nutrients fn
    WHERE fn.food_id = de.food_id
      AND fn.nutrient_id = 4
      AND fn.amount::numeric > 0
      AND (de.fiber_g IS NULL OR de.fiber_g::numeric = 0)
  `);

  console.log("Updated diary entries:", result.length);

  // Show today's diary as verification
  const today = await db.execute(sql`
    SELECT f.name, de.fiber_g, de.serving_qty, de.meal_type
    FROM diary_entries de
    JOIN foods f ON f.id = de.food_id
    WHERE de.date = '2026-02-28'
    ORDER BY de.meal_type
  `);

  console.log("\nToday's diary (after backfill):");
  let totalFiber = 0;
  for (const row of today) {
    const fiber = Number(row.fiber_g) || 0;
    totalFiber += fiber;
    console.log(`  ${row.meal_type} | ${row.name} | fiber: ${fiber}g`);
  }
  console.log(`\n  Total fiber: ${totalFiber}g`);

  await client.end();
}

main().catch(console.error);
