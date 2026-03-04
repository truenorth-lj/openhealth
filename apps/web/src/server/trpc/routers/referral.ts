import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { users, referrals, achievements, userAchievements } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  applyReferralCodeSchema,
  customizeReferralCodeSchema,
} from "@open-health/shared/schemas";
import { isUniqueViolation } from "@/lib/referral-code";

async function grantAchievement(
  db: typeof import("@/server/db").db,
  userId: string,
  achievementName: string
) {
  const [achievement] = await db
    .insert(achievements)
    .values({
      name: achievementName,
      description:
        achievementName === "推薦達人"
          ? "成功推薦一位朋友加入"
          : "透過推薦碼加入",
      icon: achievementName === "推薦達人" ? "users" : "star",
      category: "referral",
      requirement: { type: "referral" },
    })
    .onConflictDoNothing()
    .returning();

  let achievementId = achievement?.id;
  if (!achievementId) {
    const existing = await db
      .select({ id: achievements.id })
      .from(achievements)
      .where(eq(achievements.name, achievementName))
      .limit(1);
    achievementId = existing[0]?.id;
  }
  if (!achievementId) return;

  await db
    .insert(userAchievements)
    .values({ userId, achievementId })
    .onConflictDoNothing();
}

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

      try {
        await ctx.db.insert(referrals).values({
          referrerId: referrer[0].id,
          refereeId: ctx.user.id,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          return { success: false as const, error: "你已經使用過推薦碼了" };
        }
        throw error;
      }

      await Promise.all([
        grantAchievement(ctx.db, referrer[0].id, "推薦達人"),
        grantAchievement(ctx.db, ctx.user.id, "受邀新星"),
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
