import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { users, subscriptions } from "@/server/db/schema";
import {
  getStripeClient,
  syncSubscriptionStatus,
} from "@/server/services/stripe";
import {
  calculateAndRecordRevenueShare,
  clawBackPendingRewardsForReferee,
} from "@/server/services/referral-reward";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await syncSubscriptionStatus(subscription);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionStatus(subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;
      if (userId) {
        // Mark subscription as expired
        await db
          .update(subscriptions)
          .set({ status: "expired", updatedAt: new Date() })
          .where(
            and(
              eq(subscriptions.provider, "stripe"),
              eq(subscriptions.providerSubId, subscription.id)
            )
          );
        // Revert user to free plan
        await db
          .update(users)
          .set({ plan: "free", updatedAt: new Date() })
          .where(eq(users.id, userId));
        // Claw back pending revenue share rewards
        await clawBackPendingRewardsForReferee(userId);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        invoice.parent?.subscription_details?.subscription;
      if (subId && typeof subId === "string") {
        // Find the user who owns this subscription
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
          // amount_paid is in smallest currency unit (e.g. NTD cents for TWD)
          const amountNtd = invoice.amount_paid ?? 0;
          const month = new Date().toISOString().slice(0, 7); // e.g. '2026-03'
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
      const subId =
        invoice.parent?.subscription_details?.subscription;
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
