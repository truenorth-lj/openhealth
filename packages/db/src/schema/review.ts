import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const weeklyGoals = pgTable(
  "weekly_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    weekId: varchar("week_id", { length: 8 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    targetMinutes: integer("target_minutes"),
    sortOrder: integer("sort_order").default(0).notNull(),
    parentId: uuid("parent_id"),
    color: varchar("color", { length: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("weekly_goals_user_week_idx").on(table.userId, table.weekId)]
);

export const weeklyGoalsRelations = relations(weeklyGoals, ({ one, many }) => ({
  parent: one(weeklyGoals, {
    fields: [weeklyGoals.parentId],
    references: [weeklyGoals.id],
    relationName: "parentChild",
  }),
  children: many(weeklyGoals, { relationName: "parentChild" }),
  timeEntries: many(timeEntries),
}));

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    weekId: varchar("week_id", { length: 8 }).notNull(),
    goalId: uuid("goal_id").references(() => weeklyGoals.id, { onDelete: "set null" }),
    date: varchar("date", { length: 10 }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    note: varchar("note", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("time_entries_user_week_idx").on(table.userId, table.weekId)]
);

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  goal: one(weeklyGoals, {
    fields: [timeEntries.goalId],
    references: [weeklyGoals.id],
  }),
}));

export const weeklyReviews = pgTable(
  "weekly_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    weekId: varchar("week_id", { length: 8 }).notNull(),
    wentWell: text("went_well"),
    canImprove: text("can_improve"),
    takeaways: text("takeaways"),
    rating: integer("rating"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("weekly_reviews_user_week_idx").on(table.userId, table.weekId)]
);
