import { readFileSync } from "fs";
import { join } from "path";
import type { FoodItem } from "./seed-foods";

interface SevenSlimFood {
  sourceId: string;
  name: string;
  brand: string;
  source: "seven";
  servingSize: number;
  servingUnit: string;
  calories: number;
  nutrients: Record<string, number>;
  metadata: {
    imageUrl: string;
    externalUrl: string;
    price: number;
    category: string;
    note: string | null;
  };
}

function loadSevenFoods(): FoodItem[] {
  const filePath = join(__dirname, "../../../../scripts/output/seven-foods-slim.json");
  const raw = readFileSync(filePath, "utf-8");
  const data: SevenSlimFood[] = JSON.parse(raw);

  return data.map((item) => ({
    name: item.name,
    brand: item.brand,
    source: item.source,
    sourceId: item.sourceId,
    servingSize: item.servingSize,
    servingUnit: item.servingUnit,
    calories: item.calories,
    nutrients: item.nutrients,
    metadata: item.metadata,
  }));
}

export const sevenFoods = loadSevenFoods();
