import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  decimal,
  boolean,
  text,
  time,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const fastingProtocolEnum = pgEnum("fasting_protocol", [
  "16_8",
  "18_6",
  "20_4",
  "omad",
  "custom",
]);

export const fastingConfigs = pgTable("fasting_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  protocol: fastingProtocolEnum("protocol").notNull(),
  eatingStart: time("eating_start").notNull(),
  eatingEnd: time("eating_end").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const fastingLogs = pgTable(
  "fasting_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    plannedHours: decimal("planned_hours", { precision: 4, scale: 1 }).notNull(),
    actualHours: decimal("actual_hours", { precision: 4, scale: 1 }),
    completed: boolean("completed").default(false).notNull(),
    note: text("note"),
  },
  (table) => [
    index("fasting_logs_user_started_idx").on(table.userId, table.startedAt),
  ]
);
