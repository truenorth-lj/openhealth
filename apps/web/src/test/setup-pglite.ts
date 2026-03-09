import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as schema from "@/server/db/schema";
import { nutrientSeedData } from "@/server/db/seed/nutrients";
import { nutrientDefinitions } from "@/server/db/schema";

export type PGliteTestDb = ReturnType<typeof drizzle<typeof schema>>;

let _client: PGlite | null = null;
let _db: PGliteTestDb | null = null;

export function getTestDb(): PGliteTestDb {
  if (!_db) throw new Error("Call setupTestDb() first");
  return _db;
}

export async function setupTestDb(): Promise<PGliteTestDb> {
  if (_db) return _db;

  _client = new PGlite();
  _db = drizzle(_client, { schema });

  // Apply full schema DDL (generated via `drizzle-kit export`)
  // This avoids migration issues with PGlite's ALTER TYPE limitations
  const ddl = readFileSync(resolve(__dirname, "schema.sql"), "utf-8");
  await _client.exec(ddl);

  // Seed nutrient definitions (needed for food/diary tests)
  for (const nutrient of nutrientSeedData) {
    await _db
      .insert(nutrientDefinitions)
      .values({
        name: nutrient.name,
        unit: nutrient.unit,
        category: nutrient.category,
        displayOrder: nutrient.displayOrder,
        dailyValue: nutrient.dailyValue?.toString() ?? null,
        usdaNutrientId: nutrient.usdaNutrientId,
      })
      .onConflictDoNothing();
  }

  return _db;
}

export async function teardownTestDb(): Promise<void> {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
  }
}

export async function cleanTables(
  db: PGliteTestDb,
  tableNames: string[]
): Promise<void> {
  if (tableNames.length === 0) return;
  await db.execute(
    sql.raw(
      `TRUNCATE TABLE ${tableNames.map((t) => `"${t}"`).join(", ")} CASCADE`
    )
  );
}
