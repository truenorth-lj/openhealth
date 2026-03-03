"use server";

import { z } from "zod";
import {
  applyReferralCodeSchema,
  customizeReferralCodeSchema,
} from "@open-health/shared/schemas";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  users,
  referrals,
  achievements,
  userAchievements,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isUniqueViolation } from "@/lib/referral-code";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function grantAchievement(userId: string, achievementName: string) {
  // Upsert the achievement definition
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

  // If it already existed, fetch it
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
  try {
    await db.insert(referrals).values({
      referrerId: referrer[0].id,
      refereeId: user.id,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, error: "你已經使用過推薦碼了" };
    }
    throw error;
  }

  // Grant achievements to both
  await Promise.all([
    grantAchievement(referrer[0].id, "推薦達人"),
    grantAchievement(user.id, "受邀新星"),
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
