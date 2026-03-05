import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { nutrientDefinitions } from "../schema";
import { nutrientSeedData } from "./nutrients";
import { seedFoods, seedFoodsBulk } from "./seed-foods";

// --- Food dataset registry ---
import { sampleFoods } from "./sample-foods";
import { carmansFoods } from "./carmans-foods";
import { vietBitesFoods } from "./viet-bites-foods";
import { familyFoods } from "./family-foods";
import { sevenFoods } from "./seven-foods";
import { erShiSuiFoods } from "./ershisui-foods";
import { powerPeakFoods } from "./powerpeak-foods";
import { xiangShiFoods } from "./xiangshi-foods";
import { louisaFoods } from "./louisa-foods";
import { starbucksFoods } from "./starbucks-foods";
import { missEnergyFoods } from "./missenergy-foods";
import { proteinBoxFoods } from "./proteinbox-foods";

interface Dataset {
  items: Parameters<typeof seedFoods>[1];
  label: string;
  bulk?: boolean; // use batch insert for large datasets
}

const FOOD_DATASETS: Record<string, Dataset> = {
  sample: { items: sampleFoods, label: "Sample Foods" },
  carmans: { items: carmansFoods, label: "Carman's" },
  "viet-bites": { items: vietBitesFoods, label: "越迷 Viet Bites" },
  family: { items: familyFoods, label: "全家 FamilyMart", bulk: true },
  seven: { items: sevenFoods, label: "7-ELEVEN", bulk: true },
  ershisui: { items: erShiSuiFoods, label: "弍食穗" },
  powerpeak: { items: powerPeakFoods, label: "極限餐盒 Power Peak" },
  xiangshi: { items: xiangShiFoods, label: "享蒔健康餐盒" },
  louisa: { items: louisaFoods, label: "路易莎 Louisa Coffee" },
  starbucks: { items: starbucksFoods, label: "星巴克 Starbucks" },
  missenergy: { items: missEnergyFoods, label: "能量小姐 Miss Energy" },
  proteinbox: { items: proteinBoxFoods, label: "蛋白盒子 The Protein Box" },
};

const connectionString = process.env.DATABASE_URL || "postgresql://lj@localhost:5432/food_record";

async function seed() {
  const client = postgres(connectionString);
  const db = drizzle(client);

  // 1. Always seed nutrient definitions (idempotent via onConflictDoNothing)
  console.log("Seeding nutrient definitions...");
  for (const nutrient of nutrientSeedData) {
    await db
      .insert(nutrientDefinitions)
      .values({
        name: nutrient.name,
        unit: nutrient.unit,
        category: nutrient.category,
        displayOrder: nutrient.displayOrder,
        dailyValue: nutrient.dailyValue ? String(nutrient.dailyValue) : null,
        usdaNutrientId: nutrient.usdaNutrientId,
      })
      .onConflictDoNothing();
  }
  console.log(`  ${nutrientSeedData.length} nutrient definitions ready`);

  // 2. Determine which datasets to seed (filter out "--" separator from pnpm)
  const requestedKeys = process.argv.slice(2).filter((arg) => arg !== "--");
  const datasetsToRun =
    requestedKeys.length > 0
      ? requestedKeys.filter((key) => {
          if (!FOOD_DATASETS[key]) {
            console.error(`Unknown dataset: "${key}". Available: ${Object.keys(FOOD_DATASETS).join(", ")}`);
            return false;
          }
          return true;
        })
      : Object.keys(FOOD_DATASETS);

  if (datasetsToRun.length === 0) {
    console.log("No datasets to seed.");
    await client.end();
    process.exit(1);
  }

  // 3. Seed food datasets
  console.log(`\nSeeding ${datasetsToRun.length} food dataset(s)...`);
  for (const key of datasetsToRun) {
    const dataset = FOOD_DATASETS[key];
    if (dataset.bulk) {
      await seedFoodsBulk(db, dataset.items, dataset.label);
    } else {
      await seedFoods(db, dataset.items, dataset.label);
    }
  }

  console.log("\nSeed complete!");
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
