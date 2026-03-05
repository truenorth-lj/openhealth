import {
  pgTable,
  uuid,
  date,
  timestamp,
  pgEnum,
  decimal,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const photoCategory = pgEnum("photo_category", ["front", "side", "back"]);

export const weightLogs = pgTable(
  "weight_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    weightKg: decimal("weight_kg", { precision: 5, scale: 2 }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("weight_logs_user_date_idx").on(table.userId, table.date),
  ]
);

export const bodyMeasurements = pgTable(
  "body_measurements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    waistCm: decimal("waist_cm", { precision: 5, scale: 1 }),
    hipCm: decimal("hip_cm", { precision: 5, scale: 1 }),
    chestCm: decimal("chest_cm", { precision: 5, scale: 1 }),
    armCm: decimal("arm_cm", { precision: 5, scale: 1 }),
    thighCm: decimal("thigh_cm", { precision: 5, scale: 1 }),
    neckCm: decimal("neck_cm", { precision: 5, scale: 1 }),
    bodyFatPct: decimal("body_fat_pct", { precision: 4, scale: 1 }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("body_measurements_user_date_idx").on(table.userId, table.date),
  ]
);

export const progressPhotos = pgTable(
  "progress_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    imageUrl: text("image_url").notNull(),
    category: photoCategory("category").default("front"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("progress_photos_user_date_idx").on(table.userId, table.date)]
);

export const tdeeCalculations = pgTable(
  "tdee_calculations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    estimatedTdee: decimal("estimated_tdee", { precision: 7, scale: 1 }).notNull(),
    weightTrend: decimal("weight_trend", { precision: 5, scale: 2 }),
    avgCaloriesIn: decimal("avg_calories_in", { precision: 7, scale: 1 }),
    confidence: decimal("confidence", { precision: 3, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tdee_user_date_idx").on(table.userId, table.date),
  ]
);
