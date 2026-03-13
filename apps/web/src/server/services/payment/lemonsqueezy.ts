import crypto from "crypto";
import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  type Subscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import type {
  PaymentProvider,
  SubscriptionData,
  CheckoutResult,
  PortalResult,
} from "./types";

export class LemonSqueezyPaymentProvider implements PaymentProvider {
  readonly name = "lemonsqueezy" as const;
  private initialized = false;

  private init() {
    if (this.initialized) return;
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY is not set");
    lemonSqueezySetup({ apiKey });
    this.initialized = true;
  }

  async createCheckout(params: {
    userId: string;
    email: string;
    interval: "monthly" | "yearly";
    successUrl: string;
    cancelUrl: string;
    applyCoupon?: boolean;
  }): Promise<CheckoutResult> {
    this.init();

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID is not set");

    const variantId =
      params.interval === "monthly"
        ? process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID
        : process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID;

    if (!variantId)
      throw new Error("Lemon Squeezy variant ID not configured");

    const discountCode = params.applyCoupon
      ? process.env.LEMONSQUEEZY_REFERRAL_DISCOUNT_CODE
      : undefined;

    const { data, error } = await createCheckout(
      Number(storeId),
      Number(variantId),
      {
        checkoutData: {
          email: params.email,
          custom: { user_id: params.userId },
          ...(discountCode ? { discountCode } : {}),
        },
        productOptions: {
          redirectUrl: params.successUrl,
        },
      }
    );

    if (error || !data) {
      throw new Error(
        `Lemon Squeezy checkout failed: ${error?.message ?? "unknown error"}`
      );
    }

    return { url: data.data.attributes.url };
  }

  async getPortalUrl(params: {
    providerCustId: string;
    providerSubId?: string;
    returnUrl: string;
  }): Promise<PortalResult> {
    this.init();

    const subId = params.providerSubId ?? params.providerCustId;
    const { data, error } = await getSubscription(subId);

    if (error || !data) {
      throw new Error("Could not retrieve subscription for portal URL");
    }

    const portalUrl =
      data.data.attributes.urls.customer_portal ??
      data.data.attributes.urls.update_payment_method;

    return { url: portalUrl };
  }

  /** Verify Lemon Squeezy webhook HMAC signature */
  verifyWebhook(body: string, signature: string): boolean {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!secret) throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET is not set");

    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(body).digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }

  /** Parse Lemon Squeezy subscription payload into normalized SubscriptionData */
  parseSubscription(payload: {
    data: { id: string; attributes: Subscription["data"]["attributes"] };
    meta: { custom_data?: { user_id?: string } };
  }): SubscriptionData {
    const attrs = payload.data.attributes;
    const userId = payload.meta.custom_data?.user_id;
    if (!userId)
      throw new Error("Missing user_id in webhook custom_data");

    return {
      providerSubId: String(payload.data.id),
      providerCustId: String(attrs.customer_id),
      userId,
      status: this.mapStatus(attrs.status),
      currentPeriodStart: new Date(attrs.created_at),
      currentPeriodEnd: attrs.renews_at
        ? new Date(attrs.renews_at)
        : attrs.ends_at
          ? new Date(attrs.ends_at)
          : null,
      cancelAtPeriodEnd: attrs.cancelled,
    };
  }

  private mapStatus(
    lsStatus: string
  ): SubscriptionData["status"] {
    switch (lsStatus) {
      case "active":
        return "active";
      case "cancelled":
        return "canceled";
      case "expired":
        return "expired";
      case "on_trial":
        return "trialing";
      case "past_due":
        return "past_due";
      case "paused":
        return "canceled";
      default:
        return "active";
    }
  }
}
