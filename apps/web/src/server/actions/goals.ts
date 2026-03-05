"use server";

import { z } from "zod";
import { updateGoalsSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { userGoals } from "@/server/db/schema";
import { revalidatePath } from "next/cache";

export async function updateGoals(
  input: z.infer<typeof updateGoalsSchema>
) {
  const user = await getSession();
  const validated = updateGoalsSchema.parse(input);

  await db
    .insert(userGoals)
    .values({
      userId: user.id,
      calorieTarget: validated.calorieTarget,
      proteinG: validated.proteinG != null ? String(validated.proteinG) : null,
      carbsG: validated.carbsG != null ? String(validated.carbsG) : null,
      fatG: validated.fatG != null ? String(validated.fatG) : null,
      fiberG: validated.fiberG != null ? String(validated.fiberG) : null,
    })
    .onConflictDoUpdate({
      target: userGoals.userId,
      set: {
        calorieTarget: validated.calorieTarget,
        proteinG: validated.proteinG != null ? String(validated.proteinG) : null,
        carbsG: validated.carbsG != null ? String(validated.carbsG) : null,
        fatG: validated.fatG != null ? String(validated.fatG) : null,
        fiberG: validated.fiberG != null ? String(validated.fiberG) : null,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/settings/goals");
  return { success: true };
}
