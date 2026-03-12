import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  decimal,
  boolean,
  integer,
  serial,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const foodSourceEnum = pgEnum("food_source", [
  "usda",
  "openfoodfacts",
  "user",
  "verified",
  "family",
  "seven",
]);

export const nutrientCategoryEnum = pgEnum("nutrient_category", [
  "macro",
  "vitamin",
  "mineral",
  "other",
]);

export const foods = pgTable(
  "foods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 500 }).notNull(),
    brand: varchar("brand", { length: 255 }),
    barcode: varchar("barcode", { length: 50 }),
    source: foodSourceEnum("source").notNull(),
    sourceId: varchar("source_id", { length: 100 }),
    servingSize: decimal("serving_size", { precision: 8, scale: 2 }).notNull(),
    servingUnit: varchar("serving_unit", { length: 50 }).notNull(),
    householdServing: varchar("household_serving", { length: 100 }),
    description: text("description"),
    calories: decimal("calories", { precision: 7, scale: 1 }).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    isPublic: boolean("is_public").default(true).notNull(),
    metadata: jsonb("metadata").$type<{
      imageUrl?: string;
      externalUrl?: string;
      allergens?: string[];
      vendor?: string;
      note?: string;
      [key: string]: unknown;
    }>(),
    createdBy: text("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("foods_barcode_idx").on(table.barcode),
    index("foods_name_search_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.name} || ' ' || coalesce(${table.brand}, ''))`
    ),
    index("foods_source_idx").on(table.source),
  ]
);

export const nutrientDefinitions = pgTable(
  "nutrient_definitions",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    unit: varchar("unit", { length: 20 }).notNull(),
    category: nutrientCategoryEnum("category").notNull(),
    displayOrder: integer("display_order"),
    dailyValue: decimal("daily_value", { precision: 10, scale: 3 }),
    usdaNutrientId: integer("usda_nutrient_id"),
  }
);

export const foodNutrients = pgTable(
  "food_nutrients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id")
      .references(() => foods.id, { onDelete: "cascade" })
      .notNull(),
    nutrientId: integer("nutrient_id")
      .references(() => nutrientDefinitions.id)
      .notNull(),
    amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  },
  (table) => [
    uniqueIndex("food_nutrients_unique_idx").on(table.foodId, table.nutrientId),
    index("food_nutrients_food_idx").on(table.foodId),
  ]
);

export const foodServings = pgTable(
  "food_servings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id")
      .references(() => foods.id, { onDelete: "cascade" })
      .notNull(),
    label: varchar("label", { length: 100 }).notNull(),
    grams: decimal("grams", { precision: 8, scale: 2 }).notNull(),
  },
  (table) => [index("food_servings_food_idx").on(table.foodId)]
);
