import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import { users, subscriptions } from "@/server/db/schema";
import type { PaymentProviderName, SubscriptionData } from "./types";

/**
 * Upsert subscription record and update user plan.
 * Provider-agnostic — called by all webhook handlers after normalizing data.
 */
export async function syncSubscriptionToDb(
  providerName: PaymentProviderName,
  data: SubscriptionData
): Promise<void> {
  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.provider, providerName),
        eq(subscriptions.providerSubId, data.providerSubId)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(subscriptions)
      .set({
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existing[0].id));
  } else {
    await db.insert(subscriptions).values({
      id: nanoid(),
      userId: data.userId,
      plan: "pro",
      status: data.status,
      provider: providerName,
      providerSubId: data.providerSubId,
      providerCustId: data.providerCustId,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    });
  }

  // Update user plan
  if (data.status === "active" || data.status === "trialing") {
    await db
      .update(users)
      .set({
        plan: "pro",
        planExpiresAt: data.currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.userId));
  } else if (data.status === "expired") {
    await db
      .update(users)
      .set({ plan: "free", updatedAt: new Date() })
      .where(eq(users.id, data.userId));
  }
}
