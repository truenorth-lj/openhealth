import { users, referrals } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { isUniqueViolation } from "@/lib/referral-code";
import { grantAchievement } from "./referral";
import { grantReferralTrialDays } from "./referral-reward";
import type { db as dbType } from "@/server/db";

type Db = typeof dbType;

type ApplyResult =
  | { success: true }
  | { success: false; error: string };

export async function applyReferralCode(
  db: Db,
  userId: string,
  code: string
): Promise<ApplyResult> {
  const normalizedCode = code.toUpperCase();

  // Find referrer
  const referrer = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, normalizedCode))
    .limit(1);

  if (referrer.length === 0) {
    return { success: false, error: "推薦碼不存在" };
  }

  if (referrer[0].id === userId) {
    return { success: false, error: "不能使用自己的推薦碼" };
  }

  // Insert referral — unique index on refereeId prevents duplicates
  let referralId: string;
  try {
    const [inserted] = await db
      .insert(referrals)
      .values({
        referrerId: referrer[0].id,
        refereeId: userId,
      })
      .returning({ id: referrals.id });
    referralId = inserted.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, error: "你已經使用過推薦碼了" };
    }
    throw error;
  }

  // Grant achievements + trial days to both
  await Promise.all([
    grantAchievement(referrer[0].id, "推薦達人"),
    grantAchievement(userId, "受邀新星"),
    grantReferralTrialDays(referralId, referrer[0].id, userId),
  ]);

  return { success: true };
}

export async function customizeReferralCode(
  db: Db,
  userId: string,
  code: string
): Promise<ApplyResult> {
  const normalizedCode = code.toUpperCase();

  try {
    await db
      .update(users)
      .set({ referralCode: normalizedCode, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, error: "此推薦碼已被使用" };
    }
    throw error;
  }

  return { success: true };
}
