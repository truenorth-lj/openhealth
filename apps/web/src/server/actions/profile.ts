"use server";

import { z } from "zod";
import { updateProfileSchema } from "@open-health/shared/schemas";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users, userProfiles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function updateProfile(
  input: z.infer<typeof updateProfileSchema>
) {
  const user = await getSession();
  const validated = updateProfileSchema.parse(input);

  // Update user name
  await db
    .update(users)
    .set({ name: validated.name, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Upsert user profile
  await db
    .insert(userProfiles)
    .values({
      userId: user.id,
      sex: validated.sex,
      heightCm: validated.heightCm ? String(validated.heightCm) : null,
      dateOfBirth: validated.dateOfBirth,
      activityLevel: validated.activityLevel,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        sex: validated.sex,
        heightCm: validated.heightCm ? String(validated.heightCm) : null,
        dateOfBirth: validated.dateOfBirth,
        activityLevel: validated.activityLevel,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/settings/profile");
  return { success: true };
}
