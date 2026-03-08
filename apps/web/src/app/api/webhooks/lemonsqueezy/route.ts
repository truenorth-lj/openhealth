import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { users, subscriptions } from "@/server/db/schema";
import { LemonSqueezyPaymentProvider } from "@/server/services/payment/lemonsqueezy";
import { syncSubscriptionToDb } from "@/server/services/payment";
import {
  calculateAndRecordRevenueShare,
  clawBackPendingRewardsForReferee,
} from "@/server/services/referral-reward";

const provider = new LemonSqueezyPaymentProvider();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  if (!provider.verifyWebhook(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const eventName: string = payload.meta.event_name;

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated": {
      const data = provider.parseSubscription(payload);
      await syncSubscriptionToDb("lemonsqueezy", data);
      break;
    }

    case "subscription_cancelled": {
      const subId = String(payload.data.id);
      const [sub] = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.provider, "lemonsqueezy"),
            eq(subscriptions.providerSubId, subId)
          )
        )
        .limit(1);

      await db
        .update(subscriptions)
        .set({ status: "canceled", cancelAtPeriodEnd: true, updatedAt: new Date() })
        .where(
          and(
            eq(subscriptions.provider, "lemonsqueezy"),
            eq(subscriptions.providerSubId, subId)
          )
        );

      if (sub) {
        await clawBackPendingRewardsForReferee(sub.userId);
      }
      break;
    }

    case "subscription_expired": {
      const subId = String(payload.data.id);
      await db
        .update(subscriptions)
        .set({ status: "expired", updatedAt: new Date() })
        .where(
          and(
            eq(subscriptions.provider, "lemonsqueezy"),
            eq(subscriptions.providerSubId, subId)
          )
        );

      const [sub] = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.provider, "lemonsqueezy"),
            eq(subscriptions.providerSubId, subId)
          )
        )
        .limit(1);

      if (sub) {
        await db
          .update(users)
          .set({ plan: "free", updatedAt: new Date() })
          .where(eq(users.id, sub.userId));
      }
      break;
    }

    case "subscription_payment_success": {
      const subId = String(payload.data.id);
      const [sub] = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.provider, "lemonsqueezy"),
            eq(subscriptions.providerSubId, subId)
          )
        )
        .limit(1);

      if (sub) {
        // Lemon Squeezy amounts are in cents
        const amountPaid = payload.data.attributes.first_subscription_item?.price ?? 0;
        const month = new Date().toISOString().slice(0, 7);
        const invoiceId = String(payload.data.attributes.order_id ?? payload.data.id);
        await calculateAndRecordRevenueShare(
          sub.userId,
          amountPaid,
          month,
          invoiceId
        );
      }
      break;
    }

    case "subscription_payment_failed": {
      const subId = String(payload.data.id);
      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: new Date() })
        .where(
          and(
            eq(subscriptions.provider, "lemonsqueezy"),
            eq(subscriptions.providerSubId, subId)
          )
        );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
