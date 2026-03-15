import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  decimal,
  integer,
  text,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const sleepPhaseEnum = pgEnum("sleep_phase", [
  "awake",
  "light",
  "deep",
  "rem",
]);

export const sleepDetectionMethodEnum = pgEnum("sleep_detection_method", [
  "accelerometer",
  "microphone",
  "both",
]);

// Sleep session summary — one per night
export const sleepSessions = pgTable(
  "sleep_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    sleepOnset: timestamp("sleep_onset", { withTimezone: true }).notNull(),
    wakeTime: timestamp("wake_time", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    quality: integer("quality").notNull(), // 0–100
    detectionMethod: sleepDetectionMethodEnum("detection_method").notNull(),
    // Aggregated per-minute movement data for trend graphs (kept 30 days)
    movementSamples: jsonb("movement_samples"),
    note: text("note"),
    factors: jsonb("factors").$type<string[]>(),
    // Client debug metadata — app version, recovery info, sample counts, etc.
    debugMeta: jsonb("debug_meta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sleep_sessions_user_start_idx").on(table.userId, table.startTime),
  ]
);

// Sleep phases within a session
export const sleepPhases = pgTable(
  "sleep_phases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .references(() => sleepSessions.id, { onDelete: "cascade" })
      .notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    phase: sleepPhaseEnum("phase").notNull(),
  },
  (table) => [index("sleep_phases_session_idx").on(table.sessionId)]
);

// User sleep preferences
export const sleepGoals = pgTable("sleep_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  goalHours: decimal("goal_hours", { precision: 3, scale: 1 })
    .default("8.0")
    .notNull(),
  alarmWindowMinutes: integer("alarm_window_minutes").default(30).notNull(),
});
