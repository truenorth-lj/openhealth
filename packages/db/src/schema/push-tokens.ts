import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const pushPlatformEnum = pgEnum("push_platform", [
  "web",
  "ios",
  "android",
]);

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: pushPlatformEnum("platform").notNull(),
    token: text("token").notNull(), // Web Push: JSON(endpoint+keys), Expo: ExpoPushToken
    deviceName: text("device_name"), // optional, for UI display
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("push_tokens_user_idx").on(table.userId),
    uniqueIndex("push_tokens_user_token_idx").on(table.userId, table.token),
  ]
);
