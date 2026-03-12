import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  pgEnum,
  decimal,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { foods, foodServings } from "./foods";

export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const diaryEntries = pgTable(
  "diary_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    mealType: mealTypeEnum("meal_type").notNull(),
    foodId: uuid("food_id")
      .references(() => foods.id)
      .notNull(),
    servingQty: decimal("serving_qty", { precision: 6, scale: 2 })
      .default("1")
      .notNull(),
    servingId: uuid("serving_id").references(() => foodServings.id),
    calories: decimal("calories", { precision: 7, scale: 1 }),
    proteinG: decimal("protein_g", { precision: 6, scale: 1 }),
    carbsG: decimal("carbs_g", { precision: 6, scale: 1 }),
    fatG: decimal("fat_g", { precision: 6, scale: 1 }),
    fiberG: decimal("fiber_g", { precision: 6, scale: 1 }),
    sortOrder: integer("sort_order").default(0),
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("diary_user_date_idx").on(table.userId, table.date),
    index("diary_user_date_meal_idx").on(table.userId, table.date, table.mealType),
    uniqueIndex("diary_user_date_meal_food_idx").on(table.userId, table.date, table.mealType, table.foodId),
  ]
);

export const diaryEntriesRelations = relations(diaryEntries, ({ one }) => ({
  food: one(foods, {
    fields: [diaryEntries.foodId],
    references: [foods.id],
  }),
  serving: one(foodServings, {
    fields: [diaryEntries.servingId],
    references: [foodServings.id],
  }),
}));

export const quickFoods = pgTable(
  "quick_foods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    foodId: uuid("food_id")
      .references(() => foods.id, { onDelete: "cascade" })
      .notNull(),
    useCount: integer("use_count").default(1).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("quick_foods_user_food_idx").on(table.userId, table.foodId),
  ]
);

export const savedMeals = pgTable("saved_meals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const savedMealItems = pgTable("saved_meal_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  savedMealId: uuid("saved_meal_id")
    .references(() => savedMeals.id, { onDelete: "cascade" })
    .notNull(),
  foodId: uuid("food_id")
    .references(() => foods.id)
    .notNull(),
  servingQty: decimal("serving_qty", { precision: 6, scale: 2 })
    .default("1")
    .notNull(),
  servingId: uuid("serving_id").references(() => foodServings.id),
});

