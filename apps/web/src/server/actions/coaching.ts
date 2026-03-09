"use server";

import { z } from "zod";
import { connectToCoachSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import * as coachingService from "@/server/services/coaching-mutation";

export async function connectToCoach(
  input: z.infer<typeof connectToCoachSchema>
) {
  const user = await getSession();
  const validated = connectToCoachSchema.parse(input);
  const result = await coachingService.connectToCoach(db, user.id, validated.code);

  revalidatePath("/settings/coaching");
  return result;
}

export async function disconnectFromCoach(coachId: string) {
  const user = await getSession();
  await coachingService.disconnectFromCoach(db, user.id, coachId);

  revalidatePath("/settings/coaching");
  return { success: true };
}
