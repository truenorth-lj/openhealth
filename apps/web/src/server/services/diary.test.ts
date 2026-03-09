import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { eq, and, sql } from "drizzle-orm";

// Mock DB module — PGlite instance will be injected via getter
import { setupTestDb, teardownTestDb, cleanTables, getTestDb, type PGliteTestDb } from "@/test/setup-pglite";

vi.mock("@/server/db", () => ({
  get db() {
    return getTestDb();
  },
}));

import { logFood, removeEntry, copyMealToDate } from "./diary";
import { diaryEntries, quickFoods, foods, foodNutrients } from "@/server/db/schema";
import { NUTRIENT_IDS } from "@open-health/shared/constants";

let db: PGliteTestDb;

beforeAll(async () => {
  db = await setupTestDb();
}, 30_000);

afterAll(() => teardownTestDb());

beforeEach(() =>
  cleanTables(db, ["diary_entries", "quick_foods", "food_nutrients", "foods", "users"])
);

// -- Helpers --

async function insertTestUser(id = "test-user-1") {
  await db.execute(
    sql.raw(`
      INSERT INTO "users" ("id", "name", "email", "email_verified", "created_at", "updated_at", "plan")
      VALUES ('${id}', 'Test ${id}', '${id}@test.com', true, now(), now(), 'free')
      ON CONFLICT ("id") DO NOTHING
    `)
  );
}

async function insertTestFood(overrides: {
  id?: string;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
} = {}) {
  const {
    name = "Test Apple",
    calories = 95,
    protein = 0.5,
    carbs = 25,
    fat = 0.3,
    fiber = 4.4,
  } = overrides;

  const [food] = await db
    .insert(foods)
    .values({
      name,
      source: "user",
      servingSize: "100",
      servingUnit: "g",
      calories: String(calories),
      isPublic: true,
    })
    .returning();

  // Insert macros
  const nutrients = [
    { foodId: food.id, nutrientId: NUTRIENT_IDS.protein, amount: String(protein) },
    { foodId: food.id, nutrientId: NUTRIENT_IDS.totalCarbs, amount: String(carbs) },
    { foodId: food.id, nutrientId: NUTRIENT_IDS.totalFat, amount: String(fat) },
    { foodId: food.id, nutrientId: NUTRIENT_IDS.fiber, amount: String(fiber) },
  ];
  await db.insert(foodNutrients).values(nutrients);

  return food;
}

// -- Tests --

describe("logFood", () => {
  it("creates a diary entry with correct nutrition", async () => {
    await insertTestUser();
    const food = await insertTestFood({ calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 });

    await logFood(db as any, "test-user-1", {
      date: "2026-03-09",
      mealType: "breakfast",
      foodId: food.id,
      servingQty: 1,
    });

    const entries = await db
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, "test-user-1"));

    expect(entries).toHaveLength(1);
    expect(Number(entries[0].calories)).toBe(95);
    expect(Number(entries[0].proteinG)).toBe(0.5);
    expect(Number(entries[0].carbsG)).toBe(25);
  });

  it("merges quantities when logging same food twice (upsert)", async () => {
    await insertTestUser();
    const food = await insertTestFood({ calories: 100, protein: 2, carbs: 20, fat: 1, fiber: 3 });

    await logFood(db as any, "test-user-1", {
      date: "2026-03-09",
      mealType: "lunch",
      foodId: food.id,
      servingQty: 1,
    });
    await logFood(db as any, "test-user-1", {
      date: "2026-03-09",
      mealType: "lunch",
      foodId: food.id,
      servingQty: 2,
    });

    const entries = await db
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, "test-user-1"));

    // Should be 1 entry (merged), not 2
    expect(entries).toHaveLength(1);
    expect(Number(entries[0].servingQty)).toBe(3);
    expect(Number(entries[0].calories)).toBe(300);
    expect(Number(entries[0].proteinG)).toBe(6);
  });

  it("creates separate entries for different meals", async () => {
    await insertTestUser();
    const food = await insertTestFood();

    await logFood(db as any, "test-user-1", {
      date: "2026-03-09",
      mealType: "breakfast",
      foodId: food.id,
      servingQty: 1,
    });
    await logFood(db as any, "test-user-1", {
      date: "2026-03-09",
      mealType: "dinner",
      foodId: food.id,
      servingQty: 1,
    });

    const entries = await db
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, "test-user-1"));

    expect(entries).toHaveLength(2);
  });

  it("updates quick_foods use count", async () => {
    await insertTestUser();
    const food = await insertTestFood();

    await logFood(db as any, "test-user-1", {
      date: "2026-03-09",
      mealType: "breakfast",
      foodId: food.id,
      servingQty: 1,
    });
    await logFood(db as any, "test-user-1", {
      date: "2026-03-10",
      mealType: "breakfast",
      foodId: food.id,
      servingQty: 1,
    });

    const qf = await db
      .select()
      .from(quickFoods)
      .where(eq(quickFoods.userId, "test-user-1"));

    expect(qf).toHaveLength(1);
    expect(qf[0].useCount).toBe(2);
  });

  it("scales nutrition by serving quantity", async () => {
    await insertTestUser();
    const food = await insertTestFood({ calories: 50, protein: 1, carbs: 10, fat: 0.5, fiber: 2 });

    await logFood(db as any, "test-user-1", {
      date: "2026-03-09",
      mealType: "snack",
      foodId: food.id,
      servingQty: 3,
    });

    const [entry] = await db
      .select()
      .from(diaryEntries)
      .where(eq(diaryEntries.userId, "test-user-1"));

    expect(Number(entry.calories)).toBe(150);
    expect(Number(entry.proteinG)).toBe(3);
    expect(Number(entry.carbsG)).toBe(30);
    expect(Number(entry.fatG)).toBeCloseTo(1.5);
    expect(Number(entry.fiberG)).toBe(6);
  });
});

describe("removeEntry", () => {
  it("deletes the specified diary entry", async () => {
    await insertTestUser();
    const food = await insertTestFood();

    await logFood(db as any, "test-user-1", {
      date: "2026-03-09",
      mealType: "breakfast",
      foodId: food.id,
      servingQty: 1,
    });

    const [entry] = await db.select().from(diaryEntries);
    await removeEntry(db as any, "test-user-1", entry.id);

    const remaining = await db.select().from(diaryEntries);
    expect(remaining).toHaveLength(0);
  });

  it("does not delete entries owned by other users", async () => {
    await insertTestUser("user-a");
    await insertTestUser("user-b");
    const food = await insertTestFood();

    await logFood(db as any, "user-a", {
      date: "2026-03-09",
      mealType: "breakfast",
      foodId: food.id,
      servingQty: 1,
    });

    const [entry] = await db.select().from(diaryEntries);
    await removeEntry(db as any, "user-b", entry.id);

    // Entry should still exist (user-b can't delete user-a's entry)
    const remaining = await db.select().from(diaryEntries);
    expect(remaining).toHaveLength(1);
  });
});

describe("copyMealToDate", () => {
  it("copies all entries from one date to another", async () => {
    await insertTestUser();
    const apple = await insertTestFood({ name: "Apple", calories: 95 });
    const banana = await insertTestFood({ name: "Banana", calories: 105 });

    await logFood(db as any, "test-user-1", {
      date: "2026-03-01",
      mealType: "breakfast",
      foodId: apple.id,
      servingQty: 1,
    });
    await logFood(db as any, "test-user-1", {
      date: "2026-03-01",
      mealType: "breakfast",
      foodId: banana.id,
      servingQty: 2,
    });

    const result = await copyMealToDate(db as any, "test-user-1", {
      fromDate: "2026-03-01",
      toDate: "2026-03-02",
      mealType: "breakfast",
    });

    expect(result.success).toBe(true);

    const copied = await db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userId, "test-user-1"),
          eq(diaryEntries.date, "2026-03-02")
        )
      );

    expect(copied).toHaveLength(2);
  });

  it("returns error when source meal is empty", async () => {
    await insertTestUser();

    const result = await copyMealToDate(db as any, "test-user-1", {
      fromDate: "2026-03-01",
      toDate: "2026-03-02",
      mealType: "breakfast",
    });

    expect(result).toEqual({ success: false, error: "No entries found" });
  });

  it("merges into existing entries when copying", async () => {
    await insertTestUser();
    const food = await insertTestFood({ calories: 100, protein: 2, carbs: 20, fat: 1, fiber: 1 });

    // Source
    await logFood(db as any, "test-user-1", {
      date: "2026-03-01",
      mealType: "lunch",
      foodId: food.id,
      servingQty: 1,
    });

    // Target already has the same food
    await logFood(db as any, "test-user-1", {
      date: "2026-03-02",
      mealType: "lunch",
      foodId: food.id,
      servingQty: 2,
    });

    await copyMealToDate(db as any, "test-user-1", {
      fromDate: "2026-03-01",
      toDate: "2026-03-02",
      mealType: "lunch",
    });

    const [entry] = await db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userId, "test-user-1"),
          eq(diaryEntries.date, "2026-03-02")
        )
      );

    // Should merge: 2 + 1 = 3 servings
    expect(Number(entry.servingQty)).toBe(3);
    expect(Number(entry.calories)).toBe(300);
  });
});
