"use server";

import { z } from "zod";
import { createFoodSchema } from "@open-health/shared/schemas";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { foods, foodNutrients, foodServings } from "@/server/db/schema";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function createCustomFood(
  input: z.infer<typeof createFoodSchema>
) {
  const user = await getSession();
  const validated = createFoodSchema.parse(input);

  const [food] = await db
    .insert(foods)
    .values({
      name: validated.name,
      brand: validated.brand,
      barcode: validated.barcode,
      source: "user",
      servingSize: String(validated.servingSize),
      servingUnit: validated.servingUnit,
      householdServing: validated.householdServing,
      description: validated.description,
      calories: String(validated.calories),
      isPublic: true,
      createdBy: user.id,
    })
    .returning();

  if (validated.nutrients?.length) {
    await db.insert(foodNutrients).values(
      validated.nutrients.map((n) => ({
        foodId: food.id,
        nutrientId: n.nutrientId,
        amount: String(n.amount),
      }))
    );
  }

  if (validated.alternateServings?.length) {
    await db.insert(foodServings).values(
      validated.alternateServings.map((s) => ({
        foodId: food.id,
        label: s.label,
        grams: String(s.grams),
      }))
    );
  }

  revalidatePath("/food");
  return { success: true, foodId: food.id };
}
