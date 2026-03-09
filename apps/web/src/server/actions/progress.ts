"use server";

import { z } from "zod";
import { logWeightSchema, logMeasurementsSchema, logStepsSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { weightLogs, bodyMeasurements, stepLogs } from "@/server/db/schema";
import { revalidatePath } from "next/cache";

export async function logWeight(input: z.infer<typeof logWeightSchema>) {
  const user = await getSession();
  const validated = logWeightSchema.parse(input);

  await db
    .insert(weightLogs)
    .values({
      userId: user.id,
      date: validated.date,
      weightKg: String(validated.weightKg),
      note: validated.note,
    })
    .onConflictDoUpdate({
      target: [weightLogs.userId, weightLogs.date],
      set: {
        weightKg: String(validated.weightKg),
        note: validated.note,
      },
    });

  revalidatePath("/hub/progress");
  revalidatePath("/hub/weight");
  return { success: true };
}

export async function logMeasurements(
  input: z.infer<typeof logMeasurementsSchema>
) {
  const user = await getSession();
  const validated = logMeasurementsSchema.parse(input);

  await db
    .insert(bodyMeasurements)
    .values({
      userId: user.id,
      date: validated.date,
      waistCm: validated.waistCm ? String(validated.waistCm) : null,
      hipCm: validated.hipCm ? String(validated.hipCm) : null,
      chestCm: validated.chestCm ? String(validated.chestCm) : null,
      armCm: validated.armCm ? String(validated.armCm) : null,
      thighCm: validated.thighCm ? String(validated.thighCm) : null,
      neckCm: validated.neckCm ? String(validated.neckCm) : null,
      bodyFatPct: validated.bodyFatPct ? String(validated.bodyFatPct) : null,
      note: validated.note,
    })
    .onConflictDoUpdate({
      target: [bodyMeasurements.userId, bodyMeasurements.date],
      set: {
        waistCm: validated.waistCm ? String(validated.waistCm) : null,
        hipCm: validated.hipCm ? String(validated.hipCm) : null,
        chestCm: validated.chestCm ? String(validated.chestCm) : null,
        armCm: validated.armCm ? String(validated.armCm) : null,
        thighCm: validated.thighCm ? String(validated.thighCm) : null,
        neckCm: validated.neckCm ? String(validated.neckCm) : null,
        bodyFatPct: validated.bodyFatPct ? String(validated.bodyFatPct) : null,
        note: validated.note,
      },
    });

  revalidatePath("/hub/progress");
  return { success: true };
}

export async function logSteps(input: z.infer<typeof logStepsSchema>) {
  const user = await getSession();
  const validated = logStepsSchema.parse(input);

  await db
    .insert(stepLogs)
    .values({
      userId: user.id,
      date: validated.date,
      steps: String(validated.steps),
      note: validated.note,
    })
    .onConflictDoUpdate({
      target: [stepLogs.userId, stepLogs.date],
      set: {
        steps: String(validated.steps),
        note: validated.note,
      },
    });

  revalidatePath("/hub/progress");
  revalidatePath("/hub/steps");
  return { success: true };
}
