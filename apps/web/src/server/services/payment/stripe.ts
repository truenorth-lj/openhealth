import Stripe from "stripe";
import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import { subscriptions, referrals } from "@/server/db/schema";
import type {
  PaymentProvider,
  SubscriptionData,
  CheckoutResult,
  PortalResult,
} from "./types";

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe" as const;
  private client: Stripe | null = null;

  getClient(): Stripe {
    if (!this.client) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
      this.client = new Stripe(key);
    }
    return this.client;
  }

  async createCheckout(params: {
    userId: string;
    email: string;
    interval: "monthly" | "yearly";
    successUrl: string;
    cancelUrl: string;
    applyCoupon?: boolean;
  }): Promise<CheckoutResult> {
    const stripe = this.getClient();

    const priceId =
      params.interval === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID;

    if (!priceId) throw new Error("Stripe price ID not configured");

    const customerId = await this.getOrCreateCustomer(
      params.userId,
      params.email
    );

    // Apply referral coupon if eligible
    let discounts:
      | Stripe.Checkout.SessionCreateParams["discounts"]
      | undefined;
    const couponId = process.env.STRIPE_REFERRAL_COUPON_ID;

    if (params.applyCoupon && couponId) {
      discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId.trim(), quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { userId: params.userId },
      subscription_data: { metadata: { userId: params.userId } },
      ...(discounts ? { discounts } : {}),
    });

    return { url: session.url! };
  }

  async getPortalUrl(params: {
    providerCustId: string;
    returnUrl: string;
  }): Promise<PortalResult> {
    const stripe = this.getClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: params.providerCustId,
      return_url: params.returnUrl,
    });
    return { url: session.url };
  }

  /** Verify Stripe webhook signature and return the parsed event */
  verifyWebhook(body: string, signature: string): Stripe.Event {
    const stripe = this.getClient();
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  }

  /** Parse a Stripe.Subscription into normalized SubscriptionData */
  parseSubscription(sub: Stripe.Subscription): SubscriptionData {
    const userId = sub.metadata.userId;
    if (!userId) throw new Error("Missing userId in subscription metadata");

    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    const firstItem = sub.items.data[0];
    const currentPeriodStart = firstItem
      ? new Date(firstItem.current_period_start * 1000)
      : new Date(sub.start_date * 1000);
    const currentPeriodEnd = firstItem
      ? new Date(firstItem.current_period_end * 1000)
      : null;

    return {
      providerSubId: sub.id,
      providerCustId: customerId,
      userId,
      status: this.mapStatus(sub.status),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  }

  private async getOrCreateCustomer(
    userId: string,
    email: string
  ): Promise<string> {
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

    if (existing[0]?.providerCustId) return existing[0].providerCustId;

    const stripe = this.getClient();
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    return customer.id;
  }

  /** Check if user is a first-time referred user (eligible for coupon) */
  async isReferralEligible(userId: string): Promise<boolean> {
    const [referral] = await db
      .select({ id: referrals.id })
      .from(referrals)
      .where(eq(referrals.refereeId, userId))
      .limit(1);

    if (!referral) return false;

    const [existingSub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    return !existingSub;
  }

  private mapStatus(
    stripeStatus: Stripe.Subscription.Status
  ): SubscriptionData["status"] {
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
        return "active";
    }
  }
}
