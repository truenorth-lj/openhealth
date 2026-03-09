"use server";

import { z } from "zod";
import { logFoodSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import * as diaryService from "@/server/services/diary";

export async function logFood(input: z.infer<typeof logFoodSchema>) {
  const user = await getSession();
  const validated = logFoodSchema.parse(input);
  await diaryService.logFood(db, user.id, validated);

  revalidatePath(`/hub/diary`);
  return { success: true };
}

export async function removeEntry(entryId: string) {
  const user = await getSession();
  await diaryService.removeEntry(db, user.id, entryId);

  revalidatePath(`/hub/diary`);
  return { success: true };
}

export async function copyMealToDate(
  fromDate: string,
  toDate: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const user = await getSession();
  const result = await diaryService.copyMealToDate(db, user.id, { fromDate, toDate, mealType });

  revalidatePath(`/hub/diary`);
  return result;
}
