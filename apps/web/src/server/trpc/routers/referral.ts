import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import {
  users,
  referrals,
  referralRewards,
  referralPayouts,
} from "@/server/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  applyReferralCodeSchema,
  customizeReferralCodeSchema,
} from "@open-health/shared/schemas";
import { REFERRAL, PAYOUT_METHODS, REWARD_TYPES, REWARD_STATUSES } from "@open-health/shared/constants";
import type { RefereeStatus } from "@open-health/shared/constants";
import { isUniqueViolation } from "@/lib/referral-code";
import { grantAchievement } from "@/server/services/referral";
import { grantReferralTrialDays } from "@/server/services/referral-reward";

export const referralRouter = router({
  applyCode: protectedProcedure
    .input(applyReferralCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const code = input.code.toUpperCase();
      const referrer = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.referralCode, code))
        .limit(1);

      if (referrer.length === 0) {
        return { success: false as const, error: "推薦碼不存在" };
      }
      if (referrer[0].id === ctx.user.id) {
        return { success: false as const, error: "不能使用自己的推薦碼" };
      }

      let referralId: string;
      try {
        const [inserted] = await ctx.db
          .insert(referrals)
          .values({
            referrerId: referrer[0].id,
            refereeId: ctx.user.id,
          })
          .returning({ id: referrals.id });
        referralId = inserted.id;
      } catch (error) {
        if (isUniqueViolation(error)) {
          return { success: false as const, error: "你已經使用過推薦碼了" };
        }
        throw error;
      }

      await Promise.all([
        grantAchievement(referrer[0].id, "推薦達人"),
        grantAchievement(ctx.user.id, "受邀新星"),
        grantReferralTrialDays(referralId, referrer[0].id, ctx.user.id),
      ]);

      return { success: true as const };
    }),

  customizeCode: protectedProcedure
    .input(customizeReferralCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const code = input.code.toUpperCase();
      try {
        await ctx.db
          .update(users)
          .set({ referralCode: code, updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));
      } catch (error) {
        if (isUniqueViolation(error)) {
          return { success: false as const, error: "此推薦碼已被使用" };
        }
        throw error;
      }
      return { success: true as const };
    }),

  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return { code: user?.referralCode ?? null };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const referralList = await ctx.db
      .select({
        id: referrals.id,
        name: users.name,
        joinedAt: referrals.createdAt,
        plan: users.plan,
        trialExpiresAt: users.trialExpiresAt,
      })
      .from(referrals)
      .innerJoin(users, eq(users.id, referrals.refereeId))
      .where(eq(referrals.referrerId, ctx.user.id))
      .orderBy(desc(referrals.createdAt));

    const wasReferred = await ctx.db
      .select({ id: referrals.id })
      .from(referrals)
      .where(eq(referrals.refereeId, ctx.user.id))
      .limit(1);

    const [currentUser] = await ctx.db
      .select({ trialExpiresAt: users.trialExpiresAt })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const [freeDaysResult] = await ctx.db
      .select({
        totalDays: sql<number>`coalesce(sum(${referralRewards.freeDays}), 0)`,
      })
      .from(referralRewards)
      .where(
        and(
          eq(referralRewards.userId, ctx.user.id),
          eq(referralRewards.type, REWARD_TYPES.FREE_DAYS)
        )
      );

    return {
      referralCount: referralList.length,
      referralList: referralList.map((r) => ({
        id: r.id,
        name: r.name,
        joinedAt: r.joinedAt,
        status: getRefereeStatus(r.plan, r.trialExpiresAt),
      })),
      wasReferred: wasReferred.length > 0,
      trialExpiresAt: currentUser?.trialExpiresAt ?? null,
      totalFreeDaysEarned: Number(freeDaysResult?.totalDays ?? 0),
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

  // --- Reward stats & history ---

  getRewardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const now = new Date();

    const [totals] = await ctx.db
      .select({
        totalPending: sql<number>`coalesce(sum(case when ${referralRewards.status} = ${REWARD_STATUSES.PENDING} then ${referralRewards.amountNtd} else 0 end), 0)`,
        totalConfirmed: sql<number>`coalesce(sum(case when ${referralRewards.status} = ${REWARD_STATUSES.CONFIRMED} then ${referralRewards.amountNtd} else 0 end), 0)`,
        totalPaid: sql<number>`coalesce(sum(case when ${referralRewards.status} = ${REWARD_STATUSES.PAID} then ${referralRewards.amountNtd} else 0 end), 0)`,
      })
      .from(referralRewards)
      .where(
        and(
          eq(referralRewards.userId, userId),
          eq(referralRewards.type, REWARD_TYPES.REVENUE_SHARE)
        )
      );

    const [withdrawable] = await ctx.db
      .select({
        amount: sql<number>`coalesce(sum(${referralRewards.amountNtd}), 0)`,
      })
      .from(referralRewards)
      .where(
        sql`${referralRewards.userId} = ${userId}
          AND ${referralRewards.type} = ${REWARD_TYPES.REVENUE_SHARE}
          AND ${referralRewards.status} = ${REWARD_STATUSES.CONFIRMED}
          AND ${referralRewards.confirmedAt} <= ${now}`
      );

    const [payingCount] = await ctx.db
      .select({
        count: sql<number>`count(distinct ${referrals.refereeId})`,
      })
      .from(referrals)
      .innerJoin(users, eq(users.id, referrals.refereeId))
      .where(
        and(
          eq(referrals.referrerId, userId),
          eq(users.plan, "pro")
        )
      );

    return {
      totalPending: Number(totals?.totalPending ?? 0),
      totalConfirmed: Number(totals?.totalConfirmed ?? 0),
      totalPaid: Number(totals?.totalPaid ?? 0),
      withdrawableAmount: Number(withdrawable?.amount ?? 0),
      payingRefereeCount: Number(payingCount?.count ?? 0),
    };
  }),

  getRewardHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const rewards = await ctx.db
        .select({
          id: referralRewards.id,
          type: referralRewards.type,
          status: referralRewards.status,
          amountNtd: referralRewards.amountNtd,
          freeDays: referralRewards.freeDays,
          subscriptionMonth: referralRewards.subscriptionMonth,
          confirmedAt: referralRewards.confirmedAt,
          createdAt: referralRewards.createdAt,
        })
        .from(referralRewards)
        .where(eq(referralRewards.userId, ctx.user.id))
        .orderBy(desc(referralRewards.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rewards;
    }),

  requestPayout: protectedProcedure
    .input(
      z.object({
        method: z.enum(PAYOUT_METHODS),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const now = new Date();

      // Use transaction to prevent race conditions on concurrent payout requests
      return await ctx.db.transaction(async (tx) => {
        const withdrawableRewards = await tx
          .select({
            id: referralRewards.id,
            amountNtd: referralRewards.amountNtd,
          })
          .from(referralRewards)
          .where(
            sql`${referralRewards.userId} = ${userId}
              AND ${referralRewards.type} = ${REWARD_TYPES.REVENUE_SHARE}
              AND ${referralRewards.status} = ${REWARD_STATUSES.CONFIRMED}
              AND ${referralRewards.confirmedAt} <= ${now}`
          );

        const totalAmount = withdrawableRewards.reduce(
          (sum, r) => sum + (r.amountNtd ?? 0),
          0
        );

        if (totalAmount < REFERRAL.MIN_PAYOUT_CENTS) {
          return {
            success: false as const,
            error: "可提領餘額不足 NT$500",
          };
        }

        const [payout] = await tx
          .insert(referralPayouts)
          .values({
            userId,
            amountNtd: totalAmount,
            method: input.method,
            status: REWARD_STATUSES.PENDING,
          })
          .returning();

        const rewardIds = withdrawableRewards.map((r) => r.id);
        if (rewardIds.length > 0) {
          await tx
            .update(referralRewards)
            .set({ status: REWARD_STATUSES.PAID })
            .where(
              sql`${referralRewards.id} IN (${sql.join(
                rewardIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            );
        }

        return {
          success: true as const,
          payoutId: payout.id,
          amount: totalAmount,
        };
      });
    }),
});

function getRefereeStatus(
  plan: string,
  trialExpiresAt: Date | null
): RefereeStatus {
  if (plan === "pro") return "paid";
  if (trialExpiresAt && trialExpiresAt > new Date()) return "trial";
  return "registered";
}
