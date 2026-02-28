import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  pgEnum,
  integer,
  jsonb,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const streakTypeEnum = pgEnum("streak_type", [
  "logging",
  "weight",
  "water",
  "exercise",
  "fasting",
]);

export const streaks = pgTable(
  "streaks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    streakType: streakTypeEnum("streak_type").notNull(),
    currentCount: integer("current_count").default(0).notNull(),
    longestCount: integer("longest_count").default(0).notNull(),
    lastLoggedDate: date("last_logged_date"),
  },
  (table) => [
    uniqueIndex("streaks_user_type_idx").on(table.userId, table.streakType),
  ]
);

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  category: varchar("category", { length: 50 }),
  requirement: jsonb("requirement").notNull(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    achievementId: integer("achievement_id")
      .references(() => achievements.id)
      .notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_achievements_unique_idx").on(table.userId, table.achievementId),
  ]
);
