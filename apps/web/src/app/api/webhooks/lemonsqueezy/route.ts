import { NextRequest, NextResponse } from "next/server";
import { eq, and, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { LemonSqueezyPaymentProvider } from "@/server/services/payment/lemonsqueezy";
import { syncSubscriptionToDb } from "@/server/services/payment";
import {
  calculateAndRecordRevenueShare,
  clawBackPendingRewardsForReferee,
} from "@/server/services/referral-reward";

const provider = new LemonSqueezyPaymentProvider();

/** Build a where clause matching a Lemon Squeezy subscription by its ID */
function lsSubWhere(subId: string): SQL {
  return and(
    eq(subscriptions.provider, "lemonsqueezy"),
    eq(subscriptions.providerSubId, subId)
  )!;
}

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
      const data = provider.parseSubscription(payload);
      await syncSubscriptionToDb("lemonsqueezy", data);
      await clawBackPendingRewardsForReferee(data.userId);
      break;
    }

    case "subscription_expired": {
      const data = provider.parseSubscription(payload);
      await syncSubscriptionToDb("lemonsqueezy", data);
      break;
    }

    case "subscription_payment_success": {
      const subId = String(payload.data.id);
      const [sub] = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(lsSubWhere(subId))
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
      const data = provider.parseSubscription(payload);
      await syncSubscriptionToDb("lemonsqueezy", data);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
