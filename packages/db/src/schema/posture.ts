import {
  pgTable,
  uuid,
  timestamp,
  text,
  integer,
  boolean,
  decimal,
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

// ─── AirPods Posture Detection ─────────────────────────────

export const postureDetectionSessions = pgTable(
  "posture_detection_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
    baselinePitch: decimal("baseline_pitch", { precision: 6, scale: 3 }).notNull(),
    thresholdDegrees: decimal("threshold_degrees", { precision: 4, scale: 1 })
      .default("8.5")
      .notNull(),
    totalDurationMinutes: integer("total_duration_minutes").notNull(),
    goodPostureMinutes: integer("good_posture_minutes").notNull(),
    badPostureMinutes: integer("bad_posture_minutes").notNull(),
    averageDeviation: decimal("average_deviation", { precision: 6, scale: 3 }),
    maxDeviation: decimal("max_deviation", { precision: 6, scale: 3 }),
    slouchCount: integer("slouch_count").default(0).notNull(),
    notificationCount: integer("notification_count").default(0).notNull(),
    score: integer("score").notNull(), // 0-100
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("posture_detection_user_started_idx").on(table.userId, table.startedAt),
  ]
);

export const postureDetectionConfig = pgTable("posture_detection_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  thresholdDegrees: decimal("threshold_degrees", { precision: 4, scale: 1 })
    .default("8.5")
    .notNull(),
  notificationCooldownSeconds: integer("notification_cooldown_seconds")
    .default(120)
    .notNull(),
  enabled: boolean("enabled").default(true).notNull(),
});
