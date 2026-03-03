export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const { db } = await import("./server/db");
    // Path is relative to CWD. Migration files are included in standalone build
    // via outputFileTracingIncludes in next.config.ts.
    await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
