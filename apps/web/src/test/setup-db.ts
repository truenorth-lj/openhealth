import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "@/server/db/schema";
import { nutrientSeedData } from "@/server/db/seed/nutrients";
import { nutrientDefinitions } from "@/server/db/schema";

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

let _client: ReturnType<typeof postgres> | null = null;
let _db: TestDb | null = null;

export function getTestDb(): TestDb {
  if (_db) return _db;

  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Run: docker compose -f docker-compose.test.yml up -d"
    );
  }

  _client = postgres(url, { max: 3, idle_timeout: 5, connect_timeout: 10 });
  _db = drizzle(_client, { schema });
  return _db;
}

export async function setupTestDb(): Promise<TestDb> {
  const db = getTestDb();

  // Schema is pushed via `drizzle-kit push` in CI before tests run.
  // Seed nutrient definitions (needed for food/diary tests)
  for (const nutrient of nutrientSeedData) {
    await db
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

  return db;
}

export async function teardownTestDb(): Promise<void> {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
  }
}

export async function cleanTables(db: TestDb, tableNames: string[]): Promise<void> {
  if (tableNames.length === 0) return;
  await db.execute(sql.raw(`TRUNCATE TABLE ${tableNames.map(t => `"${t}"`).join(", ")} CASCADE`));
}
