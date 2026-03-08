import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { users, subscriptions } from "@/server/db/schema";
import { StripePaymentProvider } from "@/server/services/payment/stripe";
import { syncSubscriptionToDb } from "@/server/services/payment";
import {
  calculateAndRecordRevenueShare,
  clawBackPendingRewardsForReferee,
} from "@/server/services/referral-reward";
import type Stripe from "stripe";

const provider = new StripePaymentProvider();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = provider.verifyWebhook(body, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const stripe = provider.getClient();
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const data = provider.parseSubscription(subscription);
        await syncSubscriptionToDb("stripe", data);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const data = provider.parseSubscription(subscription);
      await syncSubscriptionToDb("stripe", data);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;
      if (userId) {
        await db
          .update(subscriptions)
          .set({ status: "expired", updatedAt: new Date() })
          .where(
            and(
              eq(subscriptions.provider, "stripe"),
              eq(subscriptions.providerSubId, subscription.id)
            )
          );
        await db
          .update(users)
          .set({ plan: "free", updatedAt: new Date() })
          .where(eq(users.id, userId));
        await clawBackPendingRewardsForReferee(userId);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.parent?.subscription_details?.subscription;
      if (subId && typeof subId === "string") {
        const [sub] = await db
          .select({ userId: subscriptions.userId })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.provider, "stripe"),
              eq(subscriptions.providerSubId, subId)
            )
          )
          .limit(1);

        if (sub) {
          const amountNtd = invoice.amount_paid ?? 0;
          const month = new Date().toISOString().slice(0, 7);
          await calculateAndRecordRevenueShare(
            sub.userId,
            amountNtd,
            month,
            invoice.id
          );
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.parent?.subscription_details?.subscription;
      if (subId && typeof subId === "string") {
        await db
          .update(subscriptions)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(
            and(
              eq(subscriptions.provider, "stripe"),
              eq(subscriptions.providerSubId, subId)
            )
          );
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
