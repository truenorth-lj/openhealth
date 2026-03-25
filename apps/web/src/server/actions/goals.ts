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

  const result = updateGoalsSchema.safeParse(input);
  if (!result.success) {
    return { success: false as const, error: result.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await updateGoalsService(db, user.id, result.data);
  } catch (e) {
    console.error("[updateGoals] DB error:", e);
    return { success: false as const, error: "Failed to save goals" };
  }

  revalidatePath("/settings/goals");
  return { success: true as const };
}
