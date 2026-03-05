import Stripe from "stripe";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import { users, subscriptions } from "@/server/db/schema";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const existing = await db
    .select({ providerCustId: subscriptions.providerCustId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.provider, "stripe")
      )
    )
    .limit(1);

  if (existing[0]?.providerCustId) {
    return existing[0].providerCustId;
  }

  // Create a new Stripe customer
  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripeClient();
  const customerId = await getOrCreateStripeCustomer(userId, email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  return session.url!;
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function syncSubscriptionStatus(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const userId = stripeSubscription.metadata.userId;
  if (!userId) return;

  const customerId =
    typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

  const status = mapStripeStatus(stripeSubscription.status);
  // In Stripe v20, period info moved to subscription items
  const firstItem = stripeSubscription.items.data[0];
  const currentPeriodStart = firstItem
    ? new Date(firstItem.current_period_start * 1000)
    : new Date(stripeSubscription.start_date * 1000);
  const currentPeriodEnd = firstItem
    ? new Date(firstItem.current_period_end * 1000)
    : null;

  // Upsert subscription record
  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.provider, "stripe"),
        eq(subscriptions.providerSubId, stripeSubscription.id)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(subscriptions)
      .set({
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existing[0].id));
  } else {
    await db.insert(subscriptions).values({
      id: nanoid(),
      userId,
      plan: "pro",
      status,
      provider: "stripe",
      providerSubId: stripeSubscription.id,
      providerCustId: customerId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    });
  }

  // Update user plan
  if (status === "active" || status === "trialing") {
    await db
      .update(users)
      .set({
        plan: "pro",
        planExpiresAt: currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } else if (status === "expired" || status === "canceled") {
    await db
      .update(users)
      .set({
        plan: "free",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
    case "incomplete_expired":
      return "expired";
    default:
      return stripeStatus;
  }
}
