"use server";

import { z } from "zod";
import { connectToCoachSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { users, coachClients } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isUniqueViolation } from "@/lib/referral-code";

export async function connectToCoach(
  input: z.infer<typeof connectToCoachSchema>
) {
  const user = await getSession();
  const validated = connectToCoachSchema.parse(input);
  const code = validated.code.toUpperCase();

  // Find coach by referralCode
  const coach = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, code))
    .limit(1);

  if (coach.length === 0) {
    return { success: false, error: "教練碼不存在" };
  }

  if (coach[0].id === user.id) {
    return { success: false, error: "不能加入自己為教練" };
  }

  try {
    await db.insert(coachClients).values({
      coachId: coach[0].id,
      clientId: user.id,
      startDate: new Date().toISOString().slice(0, 10),
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, error: "你已經是此教練的學員了" };
    }
    throw error;
  }

  revalidatePath("/settings/coaching");
  return { success: true };
}

export async function disconnectFromCoach(coachId: string) {
  const user = await getSession();

  await db
    .update(coachClients)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(
      and(
        eq(coachClients.coachId, coachId),
        eq(coachClients.clientId, user.id),
        eq(coachClients.status, "active")
      )
    );

  revalidatePath("/settings/coaching");
  return { success: true };
}
