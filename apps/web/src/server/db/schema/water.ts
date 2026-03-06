import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const waterLogs = pgTable(
  "water_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    amountMl: integer("amount_ml").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("water_logs_user_date_idx").on(table.userId, table.date)]
);

export const waterContainers = pgTable("water_containers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  amountMl: integer("amount_ml").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const waterGoals = pgTable("water_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  dailyTargetMl: integer("daily_target_ml").default(2500).notNull(),
});
