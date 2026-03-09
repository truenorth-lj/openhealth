"use server";

import { z } from "zod";
import { createFoodSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { createCustomFood as createCustomFoodService } from "@/server/services/food-mutation";

export async function createCustomFood(
  input: z.infer<typeof createFoodSchema>
) {
  const user = await getSession();
  const validated = createFoodSchema.parse(input);
  const result = await createCustomFoodService(db, user.id, validated);

  revalidatePath("/food");
  return { success: true, foodId: result.foodId };
}
