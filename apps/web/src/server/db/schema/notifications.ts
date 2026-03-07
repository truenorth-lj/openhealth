import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const waterReminderSettings = pgTable("water_reminder_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  startTime: text("start_time").default("08:00").notNull(), // HH:mm format
  endTime: text("end_time").default("22:00").notNull(), // HH:mm format
  intervalMinutes: integer("interval_minutes").default(120).notNull(), // default 2 hours
  stopWhenGoalReached: boolean("stop_when_goal_reached").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
