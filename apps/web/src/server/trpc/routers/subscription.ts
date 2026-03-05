import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { subscriptions } from "@/server/db/schema";
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "@/server/services/stripe";

export const subscriptionRouter = router({
  createCheckout: protectedProcedure
    .input(z.object({ interval: z.enum(["monthly", "yearly"]) }))
    .mutation(async ({ ctx, input }) => {
      const priceId =
        input.interval === "monthly"
          ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
          : process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID;

      if (!priceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Price ID not configured",
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://openhealth.blog";
      try {
        const url = await createCheckoutSession(
          ctx.user.id,
          ctx.user.email,
          priceId.trim(),
          `${baseUrl}/settings/subscription?success=true`,
          `${baseUrl}/settings/subscription?canceled=true`
        );
        return { url };
      } catch (err) {
        console.error("[createCheckout] Stripe error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Stripe checkout failed",
        });
      }
    }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const sub = await ctx.db
      .select({ providerCustId: subscriptions.providerCustId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, ctx.user.id),
          eq(subscriptions.provider, "stripe")
        )
      )
      .limit(1);

    if (!sub[0]?.providerCustId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No subscription found",
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://openhealth.blog";
    const url = await createCustomerPortalSession(
      sub[0].providerCustId,
      `${baseUrl}/settings/subscription`
    );

    return { url };
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await ctx.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, ctx.user.id),
          eq(subscriptions.provider, "stripe")
        )
      )
      .limit(1);

    return sub[0] ?? null;
  }),
});
