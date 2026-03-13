export type PaymentProviderName = "stripe" | "lemonsqueezy";

export interface CheckoutResult {
  url: string;
}

export interface PortalResult {
  url: string;
}

/** Normalized subscription data from any payment provider */
export interface SubscriptionData {
  providerSubId: string;
  providerCustId: string;
  userId: string;
  status: "active" | "canceled" | "trialing" | "past_due" | "expired";
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/** Normalized invoice data from any payment provider */
export interface InvoiceData {
  providerInvoiceId: string;
  providerSubId: string;
  amountPaid: number; // smallest currency unit
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;

  createCheckout(params: {
    userId: string;
    email: string;
    interval: "monthly" | "yearly";
    successUrl: string;
    cancelUrl: string;
    applyCoupon?: boolean;
  }): Promise<CheckoutResult>;

  getPortalUrl(params: {
    providerCustId: string;
    providerSubId?: string;
    returnUrl: string;
  }): Promise<PortalResult>;
}
