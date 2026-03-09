export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    // Skip migrations when schema is set up externally (e.g., drizzle-kit push in E2E/CI)
    if (!process.env.SKIP_MIGRATIONS) {
      const { migrate } = await import("drizzle-orm/postgres-js/migrator");
      const { db } = await import("./server/db");
      // Path is relative to CWD. Migration files are included in standalone build
      // via outputFileTracingIncludes in next.config.ts.
      try {
        await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
        // Auto-seed preset exercises if table is empty
        await seedPresetExercises(db);
      } catch (err) {
        console.error("[migration] Failed to run migrations:", err);
        // Report to Sentry but don't crash the server — existing tables still work
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(err);
      }
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedPresetExercises(db: any) {
  const { exercises } = await import("./server/db/schema");
  const { eq, sql } = await import("drizzle-orm");

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(exercises)
    .where(eq(exercises.isCustom, false));

  const presetCount = countResult[0]?.count ?? 0;
  if (presetCount > 0) return; // Already seeded

  const PRESET_EXERCISES = [
    { name: "跑步", category: "cardio" as const, metValue: "8.0" },
    { name: "快走", category: "cardio" as const, metValue: "4.3" },
    { name: "騎自行車", category: "cardio" as const, metValue: "7.5" },
    { name: "游泳", category: "cardio" as const, metValue: "6.0" },
    { name: "跳繩", category: "cardio" as const, metValue: "12.3" },
    { name: "有氧舞蹈", category: "cardio" as const, metValue: "6.5" },
    { name: "橢圓機", category: "cardio" as const, metValue: "5.0" },
    { name: "飛輪", category: "cardio" as const, metValue: "8.5" },
    { name: "划船機", category: "cardio" as const, metValue: "6.0" },
    { name: "爬樓梯", category: "cardio" as const, metValue: "9.0" },
    { name: "登山", category: "cardio" as const, metValue: "6.5" },
    { name: "重量訓練", category: "strength" as const, metValue: "6.0" },
    { name: "伏地挺身", category: "strength" as const, metValue: "3.8" },
    { name: "深蹲", category: "strength" as const, metValue: "5.0" },
    { name: "硬舉", category: "strength" as const, metValue: "6.0" },
    { name: "臥推", category: "strength" as const, metValue: "3.5" },
    { name: "引體向上", category: "strength" as const, metValue: "3.8" },
    { name: "壺鈴訓練", category: "strength" as const, metValue: "6.0" },
    { name: "瑜伽", category: "flexibility" as const, metValue: "3.0" },
    { name: "拉伸", category: "flexibility" as const, metValue: "2.5" },
    { name: "皮拉提斯", category: "flexibility" as const, metValue: "3.0" },
    { name: "太極拳", category: "flexibility" as const, metValue: "3.0" },
    { name: "籃球", category: "sport" as const, metValue: "6.5" },
    { name: "羽球", category: "sport" as const, metValue: "5.5" },
    { name: "網球", category: "sport" as const, metValue: "7.3" },
    { name: "足球", category: "sport" as const, metValue: "7.0" },
    { name: "桌球", category: "sport" as const, metValue: "4.0" },
    { name: "排球", category: "sport" as const, metValue: "4.0" },
    { name: "棒球", category: "sport" as const, metValue: "5.0" },
    { name: "高爾夫", category: "sport" as const, metValue: "3.5" },
    { name: "散步", category: "other" as const, metValue: "3.0" },
    { name: "打掃", category: "other" as const, metValue: "3.3" },
    { name: "園藝", category: "other" as const, metValue: "3.5" },
  ];

  await db.insert(exercises).values(
    PRESET_EXERCISES.map((e) => ({
      name: e.name,
      category: e.category,
      metValue: e.metValue,
      isCustom: false,
      createdBy: null,
    }))
  );

  console.log(`[seed] Inserted ${PRESET_EXERCISES.length} preset exercises`);
}
