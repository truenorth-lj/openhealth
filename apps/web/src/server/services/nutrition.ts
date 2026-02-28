import { db } from "@/server/db";
import { foods, foodNutrients, nutrientDefinitions } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function calculateNutrition(foodId: string, servingQty: number) {
  const food = await db.query.foods.findFirst({
    where: eq(foods.id, foodId),
  });
  if (!food) throw new Error("Food not found");

  const macros = await db
    .select({
      name: nutrientDefinitions.name,
      amount: foodNutrients.amount,
    })
    .from(foodNutrients)
    .innerJoin(nutrientDefinitions, eq(foodNutrients.nutrientId, nutrientDefinitions.id))
    .where(
      and(
        eq(foodNutrients.foodId, foodId),
        sql`${nutrientDefinitions.name} IN ('Protein', 'Total Carbohydrate', 'Total Fat', 'Dietary Fiber')`
      )
    );

  const macroMap: Record<string, number> = {};
  macros.forEach((m) => {
    macroMap[m.name] = Number(m.amount) * servingQty;
  });

  return {
    calories: Number(food.calories) * servingQty,
    proteinG: macroMap["Protein"] || 0,
    carbsG: macroMap["Total Carbohydrate"] || 0,
    fatG: macroMap["Total Fat"] || 0,
    fiberG: macroMap["Dietary Fiber"] || 0,
  };
}
