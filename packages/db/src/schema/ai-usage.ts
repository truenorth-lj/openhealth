import {
  pgTable,
  text,
  date,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    feature: text("feature").notNull(),
    date: date("date").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("ai_usage_user_feature_date_idx").on(
      table.userId,
      table.feature,
      table.date
    ),
  ]
);
