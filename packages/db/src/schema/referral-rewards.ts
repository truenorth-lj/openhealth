import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { users } from "./users";
import { referrals } from "./referrals";

export const referralRewards = pgTable(
  "referral_rewards",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    referralId: uuid("referral_id")
      .references(() => referrals.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(), // 'free_days' | 'revenue_share'
    status: text("status").notNull().default("confirmed"), // 'pending' | 'confirmed' | 'paid' | 'clawed_back'
    amountNtd: integer("amount_ntd"), // for revenue_share, in USD cents (column name is legacy)
    freeDays: integer("free_days"), // for free_days type
    subscriptionMonth: text("subscription_month"), // e.g. '2026-03' for revenue_share
    providerInvoiceId: text("provider_invoice_id"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("idx_referral_rewards_user").on(t.userId),
    index("idx_referral_rewards_referral").on(t.referralId),
    index("idx_referral_rewards_status").on(t.status),
  ]
);

export const referralPayouts = pgTable(
  "referral_payouts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    amountNtd: integer("amount_ntd").notNull(), // in USD cents (column name is legacy)
    method: text("method").notNull(), // 'subscription_credit' | 'bank_transfer'
    status: text("status").notNull().default("pending"), // 'pending' | 'processing' | 'completed' | 'rejected'
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [index("idx_referral_payouts_user").on(t.userId)]
);
