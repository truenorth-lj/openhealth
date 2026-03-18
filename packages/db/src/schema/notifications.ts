import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationPreferences = pgTable("notification_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  dailyDigestEnabled: boolean("daily_digest_enabled").default(true).notNull(),
  inactiveNudgeEnabled: boolean("inactive_nudge_enabled")
    .default(true)
    .notNull(),
  customRemindersEnabled: boolean("custom_reminders_enabled")
    .default(true)
    .notNull(),
  quietHoursStart: text("quiet_hours_start"), // "23:00"
  quietHoursEnd: text("quiet_hours_end"), // "07:00"
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const waterReminderSettings = pgTable("water_reminder_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  reminderMode: text("reminder_mode").default("interval").notNull(), // 'interval' | 'milestone'
  startTime: text("start_time").default("08:00").notNull(), // HH:mm format
  endTime: text("end_time").default("22:00").notNull(), // HH:mm format
  intervalMinutes: integer("interval_minutes").default(120).notNull(), // default 2 hours
  stopWhenGoalReached: boolean("stop_when_goal_reached").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const waterMilestoneCheckpoints = pgTable(
  "water_milestone_checkpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    time: text("time").notNull(), // HH:mm format
    targetMl: integer("target_ml").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("water_milestone_checkpoints_user_idx").on(table.userId),
  ]
);
