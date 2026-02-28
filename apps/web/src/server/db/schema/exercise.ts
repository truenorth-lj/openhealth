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
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const exerciseCategoryEnum = pgEnum("exercise_category", [
  "cardio",
  "strength",
  "flexibility",
  "sport",
  "other",
]);

export const intensityEnum = pgEnum("intensity", ["low", "moderate", "high"]);

export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: exerciseCategoryEnum("category"),
  metValue: decimal("met_value", { precision: 4, scale: 1 }),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdBy: text("created_by").references(() => users.id),
});

export const exerciseLogs = pgTable(
  "exercise_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id)
      .notNull(),
    durationMin: integer("duration_min"),
    caloriesBurned: decimal("calories_burned", { precision: 6, scale: 1 }),
    intensity: intensityEnum("intensity"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("exercise_logs_user_date_idx").on(table.userId, table.date)]
);
