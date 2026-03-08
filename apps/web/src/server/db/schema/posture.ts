import {
  pgTable,
  uuid,
  timestamp,
  text,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const postureDefinitions = pgTable(
  "posture_definitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    maxMinutes: integer("max_minutes").notNull(),
    suggestedBreak: text("suggested_break").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
  },
  (table) => [
    index("posture_definitions_user_idx").on(table.userId),
  ]
);

export const postureSessions = pgTable(
  "posture_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    postureId: uuid("posture_id")
      .references(() => postureDefinitions.id, { onDelete: "cascade" })
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    wasReminded: boolean("was_reminded").default(false).notNull(),
  },
  (table) => [
    index("posture_sessions_user_started_idx").on(table.userId, table.startedAt),
  ]
);

export const postureConfig = pgTable("posture_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  reminderEnabled: boolean("reminder_enabled").default(true).notNull(),
  snoozeMinutes: integer("snooze_minutes").default(10).notNull(),
});
