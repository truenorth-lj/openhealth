import { StripePaymentProvider } from "./stripe";
import { LemonSqueezyPaymentProvider } from "./lemonsqueezy";
import type { PaymentProvider } from "./types";

let instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;

  const provider = process.env.PAYMENT_PROVIDER || "stripe";

  switch (provider) {
    case "stripe":
      instance = new StripePaymentProvider();
      break;
    case "lemonsqueezy":
      instance = new LemonSqueezyPaymentProvider();
      break;
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }

  return instance;
}

export { syncSubscriptionToDb } from "./subscription-sync";
export type {
  PaymentProvider,
  PaymentProviderName,
  SubscriptionData,
  InvoiceData,
  CheckoutResult,
  PortalResult,
} from "./types";
