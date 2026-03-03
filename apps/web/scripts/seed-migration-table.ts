/**
 * One-time script to seed the __drizzle_migrations table in production.
 *
 * This is needed because the project previously used `db:push` (which doesn't
 * track migrations) instead of `db:generate` + `migrate`. Now we're switching
 * to programmatic migrations, so we need to mark existing migrations as applied.
 *
 * Usage:
 *   cd apps/web && source .env.local && DATABASE_URL=$DATABASE_URL npx tsx scripts/seed-migration-table.ts
 *
 * After running this once, delete this script — it's not needed again.
 */
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";
import crypto from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

// Read the journal to get migration entries
const journal = JSON.parse(
  readFileSync(
    join(__dirname, "../src/server/db/migrations/meta/_journal.json"),
    "utf-8"
  )
);

async function main() {
  // Create schema and table (same as drizzle-orm does)
  await sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
  await sql`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  // Check if already seeded
  const existing =
    await sql`SELECT id FROM "drizzle"."__drizzle_migrations" LIMIT 1`;
  if (existing.length > 0) {
    console.log("Migration table already has entries, skipping seed.");
    await sql.end();
    return;
  }

  // Insert entries for each migration
  for (const entry of journal.entries) {
    const migrationSql = readFileSync(
      join(
        __dirname,
        `../src/server/db/migrations/${entry.tag}.sql`
      ),
      "utf-8"
    );
    const hash = crypto.createHash("sha256").update(migrationSql).digest("hex");

    await sql`
      INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at)
      VALUES (${hash}, ${entry.when})
    `;
    console.log(`Marked migration ${entry.tag} as applied (created_at: ${entry.when})`);
  }

  console.log("Done! Migration table seeded successfully.");
  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
