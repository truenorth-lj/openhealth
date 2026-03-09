"use server";

import { z } from "zod";
import { updateProfileSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { updateProfile as updateProfileService } from "@/server/services/user-mutation";

export async function updateProfile(
  input: z.infer<typeof updateProfileSchema>
) {
  const user = await getSession();
  const validated = updateProfileSchema.parse(input);
  await updateProfileService(db, user.id, validated);

  revalidatePath("/settings/profile");
  return { success: true };
}
