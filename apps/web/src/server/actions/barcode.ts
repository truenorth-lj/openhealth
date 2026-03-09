"use server";

import { z } from "zod";
import { createFoodFromBarcodeSchema } from "@open-health/shared/schemas";
import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { createFoodFromBarcode as createFoodFromBarcodeService } from "@/server/services/food-mutation";
import { lookupOpenFoodFacts } from "@/server/services/openfoodfacts";

export { lookupOpenFoodFacts };

export async function createFoodFromBarcode(
  input: z.infer<typeof createFoodFromBarcodeSchema>
) {
  const user = await getSession();
  const validated = createFoodFromBarcodeSchema.parse(input);
  const result = await createFoodFromBarcodeService(db, user.id, validated);

  revalidatePath("/food");
  return { success: true, foodId: result.foodId };
}
