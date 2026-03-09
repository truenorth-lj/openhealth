import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { eq, sql } from "drizzle-orm";
import {
  setupTestDb,
  teardownTestDb,
  cleanTables,
  getTestDb,
  type PGliteTestDb,
} from "@/test/setup-pglite";

vi.mock("@/server/db", () => ({
  get db() {
    return getTestDb();
  },
}));

import { createCustomFood, createFoodFromBarcode } from "./food-mutation";
import { foods, foodNutrients, foodServings } from "@/server/db/schema";
import { NUTRIENT_IDS } from "@open-health/shared/constants";

let db: PGliteTestDb;

beforeAll(async () => {
  db = await setupTestDb();
}, 30_000);

afterAll(() => teardownTestDb());

beforeEach(() =>
  cleanTables(db, ["food_nutrients", "food_servings", "foods", "users"])
);

async function insertTestUser(id = "test-user-1") {
  await db.execute(
    sql.raw(`
      INSERT INTO "users" ("id", "name", "email", "email_verified", "created_at", "updated_at", "plan")
      VALUES ('${id}', 'Test ${id}', '${id}@test.com', true, now(), now(), 'free')
      ON CONFLICT ("id") DO NOTHING
    `)
  );
}

describe("createCustomFood", () => {
  it("creates a food with basic info", async () => {
    await insertTestUser();

    const result = await createCustomFood(db as any, "test-user-1", {
      name: "Homemade Granola",
      servingSize: 50,
      servingUnit: "g",
      calories: 220,
    });

    expect(result.foodId).toBeDefined();

    const [food] = await db
      .select()
      .from(foods)
      .where(eq(foods.id, result.foodId));

    expect(food.name).toBe("Homemade Granola");
    expect(food.source).toBe("user");
    expect(Number(food.calories)).toBe(220);
    expect(food.createdBy).toBe("test-user-1");
  });

  it("creates food with nutrients", async () => {
    await insertTestUser();

    const result = await createCustomFood(db as any, "test-user-1", {
      name: "Protein Bar",
      servingSize: 60,
      servingUnit: "g",
      calories: 250,
      nutrients: [
        { nutrientId: NUTRIENT_IDS.protein, amount: 20 },
        { nutrientId: NUTRIENT_IDS.totalCarbs, amount: 30 },
        { nutrientId: NUTRIENT_IDS.totalFat, amount: 8 },
      ],
    });

    const nutrients = await db
      .select()
      .from(foodNutrients)
      .where(eq(foodNutrients.foodId, result.foodId));

    expect(nutrients).toHaveLength(3);

    const proteinEntry = nutrients.find((n) => n.nutrientId === NUTRIENT_IDS.protein);
    expect(proteinEntry).toBeDefined();
    expect(Number(proteinEntry!.amount)).toBe(20);
  });

  it("creates food with alternate servings", async () => {
    await insertTestUser();

    const result = await createCustomFood(db as any, "test-user-1", {
      name: "Rice",
      servingSize: 100,
      servingUnit: "g",
      calories: 130,
      alternateServings: [
        { label: "1 cup", grams: 185 },
        { label: "1/2 cup", grams: 93 },
      ],
    });

    const servings = await db
      .select()
      .from(foodServings)
      .where(eq(foodServings.foodId, result.foodId));

    expect(servings).toHaveLength(2);
    expect(servings.map((s) => s.label).sort()).toEqual(["1 cup", "1/2 cup"].sort());
  });
});

describe("createFoodFromBarcode", () => {
  it("creates a new food from barcode data", async () => {
    await insertTestUser();

    const result = await createFoodFromBarcode(db as any, "test-user-1", {
      barcode: "4901234567890",
      name: "Pocky Chocolate",
      brand: "Glico",
      servingSize: 25,
      servingUnit: "g",
      calories: 127,
      protein: 2,
      carbs: 17,
      fat: 6,
    });

    expect(result.foodId).toBeDefined();
    expect(result.alreadyExisted).toBe(false);

    const [food] = await db.select().from(foods).where(eq(foods.id, result.foodId));
    expect(food.barcode).toBe("4901234567890");
    expect(food.brand).toBe("Glico");
    expect(food.source).toBe("openfoodfacts");
  });

  it("returns existing food if barcode already exists", async () => {
    await insertTestUser();

    const first = await createFoodFromBarcode(db as any, "test-user-1", {
      barcode: "111222333",
      name: "Existing Item",
      servingSize: 100,
      servingUnit: "g",
      calories: 100,
      protein: 5,
      carbs: 10,
      fat: 3,
    });

    const second = await createFoodFromBarcode(db as any, "test-user-1", {
      barcode: "111222333",
      name: "Duplicate Item",
      servingSize: 200,
      servingUnit: "g",
      calories: 200,
      protein: 10,
      carbs: 20,
      fat: 6,
    });

    expect(second.foodId).toBe(first.foodId);
    expect(second.alreadyExisted).toBe(true);

    // Only 1 food should exist
    const allFoods = await db.select().from(foods);
    expect(allFoods).toHaveLength(1);
  });

  it("stores optional nutrients when provided", async () => {
    await insertTestUser();

    const result = await createFoodFromBarcode(db as any, "test-user-1", {
      barcode: "999888777",
      name: "Detailed Food",
      servingSize: 100,
      servingUnit: "g",
      calories: 200,
      protein: 10,
      carbs: 25,
      fat: 8,
      fiber: 3,
      sugar: 12,
      sodium: 500,
    });

    const nutrients = await db
      .select()
      .from(foodNutrients)
      .where(eq(foodNutrients.foodId, result.foodId));

    // protein + carbs + fat + fiber + sugar + sodium = 6
    expect(nutrients).toHaveLength(6);

    const fiberEntry = nutrients.find((n) => n.nutrientId === NUTRIENT_IDS.fiber);
    expect(Number(fiberEntry!.amount)).toBe(3);

    const sodiumEntry = nutrients.find((n) => n.nutrientId === NUTRIENT_IDS.sodium);
    expect(Number(sodiumEntry!.amount)).toBe(500);
  });

  it("stores image URL in metadata", async () => {
    await insertTestUser();

    const result = await createFoodFromBarcode(db as any, "test-user-1", {
      barcode: "555666777",
      name: "Food With Image",
      servingSize: 100,
      servingUnit: "g",
      calories: 150,
      protein: 5,
      carbs: 20,
      fat: 5,
      imageUrl: "https://images.example.com/food.jpg",
    });

    const [food] = await db.select().from(foods).where(eq(foods.id, result.foodId));
    expect((food.metadata as any)?.imageUrl).toBe("https://images.example.com/food.jpg");
  });
});
