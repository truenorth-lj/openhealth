import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    plan: text("plan").notNull(), // 'pro'
    status: text("status").notNull(), // 'active' | 'canceled' | 'expired' | 'trialing' | 'past_due'
    provider: text("provider").notNull(), // 'stripe'
    providerSubId: text("provider_sub_id"),
    providerCustId: text("provider_cust_id"),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_subscriptions_user").on(t.userId),
    index("idx_subscriptions_provider").on(t.provider, t.providerSubId),
  ]
);
