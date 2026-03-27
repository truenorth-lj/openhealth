"use server";

import { z } from "zod";
import { updateProfileSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { updateProfile as updateProfileService } from "@/server/services/user-mutation";

export async function updateProfile(
  input: z.infer<typeof updateProfileSchema>
) {
  const user = await getSession();

  const result = updateProfileSchema.safeParse(input);
  if (!result.success) {
    return { success: false as const, error: result.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await updateProfileService(db, user.id, result.data);
  } catch (e) {
    Sentry.captureException(e, { tags: { action: "updateProfile" } });
    console.error("[updateProfile] DB error:", e);
    return { success: false as const, error: "Failed to save profile" };
  }

  revalidatePath("/settings/profile");
  return { success: true as const };
}
