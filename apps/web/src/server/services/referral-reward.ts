import { db } from "@/server/db";
import {
  referrals,
  referralRewards,
  users,
} from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { REFERRAL } from "@open-health/shared/constants";

/**
 * Grant free trial days to both referee and referrer.
 * Wrapped in a transaction to ensure atomicity.
 */
export async function grantReferralTrialDays(
  referralId: string,
  referrerId: string,
  refereeId: string
) {
  await db.transaction(async (tx) => {
    const now = new Date();

    // --- Referee trial ---
    const [referee] = await tx
      .select({ trialExpiresAt: users.trialExpiresAt })
      .from(users)
      .where(eq(users.id, refereeId))
      .limit(1);

    const refereeBase =
      referee?.trialExpiresAt && referee.trialExpiresAt > now
        ? referee.trialExpiresAt
        : now;
    const refereeNewTrial = new Date(refereeBase);
    refereeNewTrial.setDate(
      refereeNewTrial.getDate() + REFERRAL.REFEREE_TRIAL_DAYS
    );

    await tx
      .update(users)
      .set({ trialExpiresAt: refereeNewTrial, updatedAt: now })
      .where(eq(users.id, refereeId));

    // --- Referrer free days (capped) ---
    const [referrer] = await tx
      .select({ trialExpiresAt: users.trialExpiresAt })
      .from(users)
      .where(eq(users.id, referrerId))
      .limit(1);

    const referrerBase =
      referrer?.trialExpiresAt && referrer.trialExpiresAt > now
        ? referrer.trialExpiresAt
        : now;
    const referrerNewTrial = new Date(referrerBase);
    referrerNewTrial.setDate(
      referrerNewTrial.getDate() + REFERRAL.REFERRER_FREE_DAYS
    );

    const maxTrial = new Date(now);
    maxTrial.setDate(maxTrial.getDate() + REFERRAL.MAX_TRIAL_DAYS);
    if (referrerNewTrial > maxTrial) {
      referrerNewTrial.setTime(maxTrial.getTime());
    }

    await tx
      .update(users)
      .set({ trialExpiresAt: referrerNewTrial, updatedAt: now })
      .where(eq(users.id, referrerId));

    // --- Insert reward records ---
    await tx.insert(referralRewards).values([
      {
        referralId,
        userId: refereeId,
        type: "free_days",
        status: "confirmed",
        freeDays: REFERRAL.REFEREE_TRIAL_DAYS,
        confirmedAt: now,
      },
      {
        referralId,
        userId: referrerId,
        type: "free_days",
        status: "confirmed",
        freeDays: REFERRAL.REFERRER_FREE_DAYS,
        confirmedAt: now,
      },
    ]);
  });
}

/**
 * Calculate and record revenue share for the referrer
 * when a referred user pays their subscription invoice.
 * Amount is assumed to be in NTD smallest unit (cents) from Stripe.
 */
export async function calculateAndRecordRevenueShare(
  refereeUserId: string,
  amountNtd: number,
  subscriptionMonth: string,
  stripeInvoiceId: string
) {
  const [referral] = await db
    .select({
      id: referrals.id,
      referrerId: referrals.referrerId,
    })
    .from(referrals)
    .where(eq(referrals.refereeId, refereeUserId))
    .limit(1);

  if (!referral) return null;

  const revenueShareNtd = Math.round(
    amountNtd * REFERRAL.REVENUE_SHARE_PERCENTAGE
  );

  const confirmedAt = new Date();
  confirmedAt.setDate(
    confirmedAt.getDate() + REFERRAL.REVENUE_SHARE_CONFIRM_DAYS
  );

  const [reward] = await db
    .insert(referralRewards)
    .values({
      referralId: referral.id,
      userId: referral.referrerId,
      type: "revenue_share",
      status: "pending",
      amountNtd: revenueShareNtd,
      subscriptionMonth,
      stripeInvoiceId,
      confirmedAt,
    })
    .returning();

  return reward;
}

/**
 * Claw back a single pending revenue share reward.
 */
export async function clawBackReward(referralRewardId: string) {
  await db
    .update(referralRewards)
    .set({ status: "clawed_back" })
    .where(eq(referralRewards.id, referralRewardId));
}

/**
 * Claw back all pending revenue share rewards for a referee
 * (used when subscription is deleted/refunded).
 */
export async function clawBackPendingRewardsForReferee(
  refereeUserId: string
) {
  const [referral] = await db
    .select({ id: referrals.id })
    .from(referrals)
    .where(eq(referrals.refereeId, refereeUserId))
    .limit(1);

  if (!referral) return;

  await db
    .update(referralRewards)
    .set({ status: "clawed_back" })
    .where(
      sql`${referralRewards.referralId} = ${referral.id} AND ${referralRewards.type} = 'revenue_share' AND ${referralRewards.status} = 'pending'`
    );
}
