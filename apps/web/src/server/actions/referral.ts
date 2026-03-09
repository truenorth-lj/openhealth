"use server";

import { z } from "zod";
import {
  applyReferralCodeSchema,
  customizeReferralCodeSchema,
} from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import * as referralService from "@/server/services/referral-mutation";

export async function applyReferralCode(
  input: z.infer<typeof applyReferralCodeSchema>
) {
  const user = await getSession();
  const validated = applyReferralCodeSchema.parse(input);
  const result = await referralService.applyReferralCode(db, user.id, validated.code);

  revalidatePath("/settings/referral");
  return result;
}

export async function customizeReferralCode(
  input: z.infer<typeof customizeReferralCodeSchema>
) {
  const user = await getSession();
  const validated = customizeReferralCodeSchema.parse(input);
  const result = await referralService.customizeReferralCode(db, user.id, validated.code);

  revalidatePath("/settings/referral");
  return result;
}
