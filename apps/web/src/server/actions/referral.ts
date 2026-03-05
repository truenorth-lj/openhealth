"use server";

import { z } from "zod";
import {
  applyReferralCodeSchema,
  customizeReferralCodeSchema,
} from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { users, referrals } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isUniqueViolation } from "@/lib/referral-code";
import { grantAchievement } from "@/server/services/referral";
import { grantReferralTrialDays } from "@/server/services/referral-reward";

export async function applyReferralCode(
  input: z.infer<typeof applyReferralCodeSchema>
) {
  const user = await getSession();
  const validated = applyReferralCodeSchema.parse(input);
  const code = validated.code.toUpperCase();

  // Find referrer
  const referrer = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, code))
    .limit(1);

  if (referrer.length === 0) {
    return { success: false, error: "推薦碼不存在" };
  }

  if (referrer[0].id === user.id) {
    return { success: false, error: "不能使用自己的推薦碼" };
  }

  // Insert referral — unique index on refereeId prevents duplicates
  let referralId: string;
  try {
    const [inserted] = await db
      .insert(referrals)
      .values({
        referrerId: referrer[0].id,
        refereeId: user.id,
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
    grantAchievement(user.id, "受邀新星"),
    grantReferralTrialDays(referralId, referrer[0].id, user.id),
  ]);

  revalidatePath("/settings/referral");
  return { success: true };
}

export async function customizeReferralCode(
  input: z.infer<typeof customizeReferralCodeSchema>
) {
  const user = await getSession();
  const validated = customizeReferralCodeSchema.parse(input);
  const code = validated.code.toUpperCase();

  // Update with unique constraint handling
  try {
    await db
      .update(users)
      .set({ referralCode: code, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, error: "此推薦碼已被使用" };
    }
    throw error;
  }

  revalidatePath("/settings/referral");
  return { success: true };
}
