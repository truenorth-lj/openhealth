import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { exercises } from "../schema";
import { eq } from "drizzle-orm";

const PRESET_EXERCISES = [
  // Cardio
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
  // Strength
  { name: "重量訓練", category: "strength" as const, metValue: "6.0" },
  { name: "伏地挺身", category: "strength" as const, metValue: "3.8" },
  { name: "深蹲", category: "strength" as const, metValue: "5.0" },
  { name: "硬舉", category: "strength" as const, metValue: "6.0" },
  { name: "臥推", category: "strength" as const, metValue: "3.5" },
  { name: "引體向上", category: "strength" as const, metValue: "3.8" },
  { name: "壺鈴訓練", category: "strength" as const, metValue: "6.0" },
  // Flexibility
  { name: "瑜伽", category: "flexibility" as const, metValue: "3.0" },
  { name: "拉伸", category: "flexibility" as const, metValue: "2.5" },
  { name: "皮拉提斯", category: "flexibility" as const, metValue: "3.0" },
  { name: "太極拳", category: "flexibility" as const, metValue: "3.0" },
  // Sport
  { name: "籃球", category: "sport" as const, metValue: "6.5" },
  { name: "羽球", category: "sport" as const, metValue: "5.5" },
  { name: "網球", category: "sport" as const, metValue: "7.3" },
  { name: "足球", category: "sport" as const, metValue: "7.0" },
  { name: "桌球", category: "sport" as const, metValue: "4.0" },
  { name: "排球", category: "sport" as const, metValue: "4.0" },
  { name: "棒球", category: "sport" as const, metValue: "5.0" },
  { name: "高爾夫", category: "sport" as const, metValue: "3.5" },
  // Other
  { name: "散步", category: "other" as const, metValue: "3.0" },
  { name: "打掃", category: "other" as const, metValue: "3.3" },
  { name: "園藝", category: "other" as const, metValue: "3.5" },
];

async function seedExercises() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required. Run: source .env.local && DATABASE_URL=$DATABASE_URL pnpm db:seed-exercises");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Seeding preset exercises...");

  let inserted = 0;
  for (const exercise of PRESET_EXERCISES) {
    const existing = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(eq(exercises.name, exercise.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(exercises).values({
        name: exercise.name,
        category: exercise.category,
        metValue: exercise.metValue,
        isCustom: false,
        createdBy: null,
      });
      inserted++;
    }
  }

  console.log(`  ${inserted} new exercises inserted (${PRESET_EXERCISES.length - inserted} already existed)`);
  console.log("Done!");
  await client.end();
  process.exit(0);
}

seedExercises().catch((err) => {
  console.error("Seed exercises failed:", err);
  process.exit(1);
});
