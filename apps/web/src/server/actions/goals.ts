"use server";

import { z } from "zod";
import { updateGoalsSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { updateGoals as updateGoalsService } from "@/server/services/user-mutation";

export async function updateGoals(
  input: z.infer<typeof updateGoalsSchema>
) {
  const user = await getSession();
  const validated = updateGoalsSchema.parse(input);
  await updateGoalsService(db, user.id, validated);

  revalidatePath("/settings/goals");
  return { success: true };
}
