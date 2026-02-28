import { readFileSync } from "fs";
import { join } from "path";
import type { FoodItem } from "./seed-foods";

interface FamilySlimFood {
  sourceId: string;
  name: string;
  brand: string;
  source: "family";
  servingSize: number;
  servingUnit: string;
  calories: number;
  nutrients: Record<string, number>;
  metadata: {
    imageUrl: string;
    externalUrl: string;
    allergens: string[];
    vendor: string;
    note: string | null;
    category: string;
  };
}

function loadFamilyFoods(): FoodItem[] {
  const filePath = join(__dirname, "../../../../scripts/output/family-foods-slim.json");
  const raw = readFileSync(filePath, "utf-8");
  const data: FamilySlimFood[] = JSON.parse(raw);

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

export const familyFoods = loadFamilyFoods();
