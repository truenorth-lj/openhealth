import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { users, referrals } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const referralRouter = router({
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return { code: user?.referralCode ?? null };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Get list of referred users
    const referralList = await ctx.db
      .select({
        id: referrals.id,
        name: users.name,
        joinedAt: referrals.createdAt,
      })
      .from(referrals)
      .innerJoin(users, eq(users.id, referrals.refereeId))
      .where(eq(referrals.referrerId, ctx.user.id))
      .orderBy(desc(referrals.createdAt));

    // Check if current user was referred
    const wasReferred = await ctx.db
      .select({ id: referrals.id })
      .from(referrals)
      .where(eq(referrals.refereeId, ctx.user.id))
      .limit(1);

    return {
      referralCount: referralList.length,
      referralList,
      wasReferred: wasReferred.length > 0,
    };
  }),

  checkCode: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const code = input.code.toUpperCase();
      const [referrer] = await ctx.db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.referralCode, code))
        .limit(1);

      return {
        valid: !!referrer,
        referrerName: referrer?.name ?? null,
      };
    }),
});
