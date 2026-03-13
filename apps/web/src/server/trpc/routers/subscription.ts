import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { subscriptions, referrals } from "@/server/db/schema";
import { getPaymentProvider } from "@/server/services/payment";

export const subscriptionRouter = router({
  createCheckout: protectedProcedure
    .input(z.object({ interval: z.enum(["monthly", "yearly"]) }))
    .mutation(async ({ ctx, input }) => {
      const provider = getPaymentProvider();
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://openhealth.blog";

      // Check referral eligibility for coupon
      let applyCoupon = false;
      const [referral] = await ctx.db
        .select({ id: referrals.id })
        .from(referrals)
        .where(eq(referrals.refereeId, ctx.user.id))
        .limit(1);

      if (referral) {
        const [existingSub] = await ctx.db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.userId, ctx.user.id))
          .limit(1);
        applyCoupon = !existingSub;
      }

      try {
        const result = await provider.createCheckout({
          userId: ctx.user.id,
          email: ctx.user.email,
          interval: input.interval,
          successUrl: `${baseUrl}/settings/subscription?success=true`,
          cancelUrl: `${baseUrl}/settings/subscription?canceled=true`,
          applyCoupon,
        });
        return { url: result.url };
      } catch (err) {
        console.error("[createCheckout] error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            err instanceof Error ? err.message : "Checkout failed",
        });
      }
    }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const provider = getPaymentProvider();

    const sub = await ctx.db
      .select({
        providerCustId: subscriptions.providerCustId,
        providerSubId: subscriptions.providerSubId,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, ctx.user.id),
          eq(subscriptions.provider, provider.name)
        )
      )
      .limit(1);

    if (!sub[0]?.providerCustId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No subscription found",
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://openhealth.blog";
    const result = await provider.getPortalUrl({
      providerCustId: sub[0].providerCustId,
      providerSubId: sub[0].providerSubId ?? undefined,
      returnUrl: `${baseUrl}/settings/subscription`,
    });

    return { url: result.url };
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const provider = getPaymentProvider();

    const sub = await ctx.db
      .select({
        id: subscriptions.id,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, ctx.user.id),
          eq(subscriptions.provider, provider.name)
        )
      )
      .limit(1);

    return sub[0] ?? null;
  }),
});
