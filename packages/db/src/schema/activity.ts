import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const activityTypeEnum = pgEnum("activity_type", [
  "exercise",
  "meditation",
]);

export const activitySessions = pgTable(
  "activity_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: activityTypeEnum("type").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationSec: integer("duration_sec"),
    note: text("note"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("activity_sessions_user_type_idx").on(
      table.userId,
      table.type,
      table.startedAt
    ),
  ]
);
