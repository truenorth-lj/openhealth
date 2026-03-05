import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createFoodSchema, createFoodFromBarcodeSchema, updateFoodSchema } from "@open-health/shared/schemas";
import { NUTRIENT_IDS } from "@open-health/shared/constants";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { foods, foodNutrients, nutrientDefinitions, foodServings } from "@/server/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { quickFoods } from "@/server/db/schema/diary";
import { lookupOpenFoodFacts } from "@/server/services/openfoodfacts";
import { recognizeNutritionLabel, estimateNutritionFromText } from "@/server/services/ai";
import { checkAndIncrementAiUsage } from "@/server/services/plan";

async function fetchFoodNutrientsAndServings(db: typeof import("@/server/db").db, foodId: string) {
  return Promise.all([
    db
      .select({
        name: nutrientDefinitions.name,
        unit: nutrientDefinitions.unit,
        category: nutrientDefinitions.category,
        amount: foodNutrients.amount,
        dailyValue: nutrientDefinitions.dailyValue,
        displayOrder: nutrientDefinitions.displayOrder,
      })
      .from(foodNutrients)
      .innerJoin(
        nutrientDefinitions,
        eq(foodNutrients.nutrientId, nutrientDefinitions.id)
      )
      .where(eq(foodNutrients.foodId, foodId))
      .orderBy(nutrientDefinitions.displayOrder),
    db
      .select()
      .from(foodServings)
      .where(eq(foodServings.foodId, foodId)),
  ]);
}

export const foodRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0), // kept for mobile backward compat
        cursor: z.number().min(0).default(0), // used by web infinite scroll
      })
    )
    .query(async ({ ctx, input }) => {
      const query = input.query.trim();
      const likePattern = `%${query}%`;
      const effectiveOffset = input.cursor || input.offset;

      const results = await ctx.db
        .select({
          id: foods.id,
          name: foods.name,
          brand: foods.brand,
          calories: foods.calories,
          servingSize: foods.servingSize,
          servingUnit: foods.servingUnit,
          householdServing: foods.householdServing,
          source: foods.source,
          isVerified: foods.isVerified,
        })
        .from(foods)
        .where(
          sql`(${foods.name} ILIKE ${likePattern} OR coalesce(${foods.brand}, '') ILIKE ${likePattern})`
        )
        .orderBy(
          sql`CASE WHEN ${foods.name} ILIKE ${likePattern} THEN 0 ELSE 1 END, ${foods.name}`
        )
        .limit(input.limit)
        .offset(effectiveOffset);

      return results;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const food = await ctx.db.query.foods.findFirst({
        where: eq(foods.id, input.id),
      });

      if (!food) return null;

      const [nutrients, servings] = await fetchFoodNutrientsAndServings(ctx.db, input.id);
      return { ...food, nutrients, servings };
    }),

  getByBarcode: publicProcedure
    .input(z.object({ barcode: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const food = await ctx.db.query.foods.findFirst({
        where: eq(foods.barcode, input.barcode),
      });

      if (!food) return null;

      const [nutrients, servings] = await fetchFoodNutrientsAndServings(ctx.db, food.id);
      return { ...food, nutrients, servings };
    }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(30).default(10) }))
    .query(async ({ ctx, input }) => {
      const recent = await ctx.db
        .select({
          id: foods.id,
          name: foods.name,
          brand: foods.brand,
          calories: foods.calories,
          servingSize: foods.servingSize,
          servingUnit: foods.servingUnit,
          householdServing: foods.householdServing,
          useCount: quickFoods.useCount,
        })
        .from(quickFoods)
        .innerJoin(foods, eq(quickFoods.foodId, foods.id))
        .where(eq(quickFoods.userId, ctx.user.id))
        .orderBy(desc(quickFoods.lastUsedAt))
        .limit(input.limit);

      return recent;
    }),

  getFrequent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const results = await ctx.db
        .select({
          id: foods.id,
          name: foods.name,
          brand: foods.brand,
          calories: foods.calories,
          servingSize: foods.servingSize,
          servingUnit: foods.servingUnit,
          householdServing: foods.householdServing,
          useCount: quickFoods.useCount,
        })
        .from(quickFoods)
        .innerJoin(foods, eq(quickFoods.foodId, foods.id))
        .where(
          and(
            eq(quickFoods.userId, ctx.user.id),
            gte(quickFoods.lastUsedAt, thirtyDaysAgo)
          )
        )
        .orderBy(desc(quickFoods.useCount), desc(quickFoods.lastUsedAt))
        .limit(input.limit)
        .offset(input.cursor);

      return results;
    }),

  getGlobalPopular: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select({
          id: foods.id,
          name: foods.name,
          brand: foods.brand,
          calories: foods.calories,
          servingSize: foods.servingSize,
          servingUnit: foods.servingUnit,
          householdServing: foods.householdServing,
          totalUseCount: sql<number>`cast(sum(${quickFoods.useCount}) as int)`.as("total_use_count"),
        })
        .from(quickFoods)
        .innerJoin(foods, eq(quickFoods.foodId, foods.id))
        .groupBy(foods.id)
        .orderBy(sql`total_use_count desc`)
        .limit(input.limit)
        .offset(input.cursor);

      return results;
    }),

  // Keep for mobile backward compat
  getGlobalRecent: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(30).default(20) }))
    .query(async ({ ctx, input }) => {
      const recent = await ctx.db
        .select({
          id: foods.id,
          name: foods.name,
          brand: foods.brand,
          calories: foods.calories,
          servingSize: foods.servingSize,
          servingUnit: foods.servingUnit,
          householdServing: foods.householdServing,
        })
        .from(foods)
        .orderBy(desc(foods.createdAt))
        .limit(input.limit);

      return recent;
    }),

  createCustomFood: protectedProcedure
    .input(createFoodSchema)
    .mutation(async ({ ctx, input }) => {
      const [food] = await ctx.db
        .insert(foods)
        .values({
          name: input.name,
          brand: input.brand,
          description: input.description,
          barcode: input.barcode,
          source: "user",
          servingSize: String(input.servingSize),
          servingUnit: input.servingUnit,
          householdServing: input.householdServing,
          calories: String(input.calories),
          isPublic: true,
          createdBy: ctx.user.id,
        })
        .returning();

      if (input.nutrients?.length) {
        await ctx.db.insert(foodNutrients).values(
          input.nutrients.map((n) => ({
            foodId: food.id,
            nutrientId: n.nutrientId,
            amount: String(n.amount),
          }))
        );
      }

      if (input.alternateServings?.length) {
        await ctx.db.insert(foodServings).values(
          input.alternateServings.map((s) => ({
            foodId: food.id,
            label: s.label,
            grams: String(s.grams),
          }))
        );
      }

      return { success: true, foodId: food.id };
    }),

  createFoodFromBarcode: protectedProcedure
    .input(createFoodFromBarcodeSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.foods.findFirst({
        where: eq(foods.barcode, input.barcode),
      });

      if (existing) {
        return { success: true, foodId: existing.id };
      }

      const [food] = await ctx.db
        .insert(foods)
        .values({
          name: input.name,
          brand: input.brand,
          barcode: input.barcode,
          source: "openfoodfacts",
          sourceId: input.barcode,
          servingSize: String(input.servingSize),
          servingUnit: input.servingUnit,
          calories: String(input.calories),
          isPublic: true,
          createdBy: ctx.user.id,
          metadata: input.imageUrl ? { imageUrl: input.imageUrl } : undefined,
        })
        .returning();

      const nutrients: { foodId: string; nutrientId: number; amount: string }[] = [
        { foodId: food.id, nutrientId: NUTRIENT_IDS.protein, amount: String(input.protein) },
        { foodId: food.id, nutrientId: NUTRIENT_IDS.totalFat, amount: String(input.fat) },
        { foodId: food.id, nutrientId: NUTRIENT_IDS.totalCarbs, amount: String(input.carbs) },
      ];

      if (input.fiber != null) {
        nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.fiber, amount: String(input.fiber) });
      }
      if (input.sugar != null) {
        nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.sugar, amount: String(input.sugar) });
      }
      if (input.saturatedFat != null) {
        nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.saturatedFat, amount: String(input.saturatedFat) });
      }
      if (input.transFat != null) {
        nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.transFat, amount: String(input.transFat) });
      }
      if (input.cholesterol != null) {
        nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.cholesterol, amount: String(input.cholesterol) });
      }
      if (input.sodium != null) {
        nutrients.push({ foodId: food.id, nutrientId: NUTRIENT_IDS.sodium, amount: String(input.sodium) });
      }

      if (nutrients.length > 0) {
        await ctx.db.insert(foodNutrients).values(nutrients);
      }

      return { success: true, foodId: food.id };
    }),

  lookupBarcode: protectedProcedure
    .input(z.object({ barcode: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return lookupOpenFoodFacts(input.barcode);
    }),

  recognizeLabel: protectedProcedure
    .input(z.object({ base64Image: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const usage = await checkAndIncrementAiUsage(ctx.user.id, "ocr", ctx.userPlan);
      if (!usage.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `已達今日 AI 辨識上限（${usage.limit} 次）`,
        });
      }
      return recognizeNutritionLabel(input.base64Image);
    }),

  estimateNutrition: protectedProcedure
    .input(z.object({ description: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const usage = await checkAndIncrementAiUsage(ctx.user.id, "estimate", ctx.userPlan);
      if (!usage.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `已達今日 AI 估算上限（${usage.limit} 次）`,
        });
      }
      return estimateNutritionFromText(input.description);
    }),

  updateFood: protectedProcedure
    .input(updateFoodSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.foods.findFirst({
        where: eq(foods.id, input.id),
      });

      if (!existing) {
        throw new Error("找不到食物");
      }

      if (existing.createdBy !== ctx.user.id) {
        throw new Error("只能編輯自己建立的食物");
      }

      const { id, nutrients, alternateServings, ...updateFields } = input;

      // Build update object with only provided fields
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (updateFields.name !== undefined) updates.name = updateFields.name;
      if (updateFields.brand !== undefined) updates.brand = updateFields.brand;
      if (updateFields.description !== undefined) updates.description = updateFields.description;
      if (updateFields.servingSize !== undefined) updates.servingSize = String(updateFields.servingSize);
      if (updateFields.servingUnit !== undefined) updates.servingUnit = updateFields.servingUnit;
      if (updateFields.householdServing !== undefined) updates.householdServing = updateFields.householdServing;
      if (updateFields.calories !== undefined) updates.calories = String(updateFields.calories);

      await ctx.db.update(foods).set(updates).where(eq(foods.id, id));

      // Replace nutrients if provided
      if (nutrients !== undefined) {
        await ctx.db.delete(foodNutrients).where(eq(foodNutrients.foodId, id));
        if (nutrients.length > 0) {
          await ctx.db.insert(foodNutrients).values(
            nutrients.map((n) => ({
              foodId: id,
              nutrientId: n.nutrientId,
              amount: String(n.amount),
            }))
          );
        }
      }

      // Replace alternate servings if provided
      if (alternateServings !== undefined) {
        await ctx.db.delete(foodServings).where(eq(foodServings.foodId, id));
        if (alternateServings.length > 0) {
          await ctx.db.insert(foodServings).values(
            alternateServings.map((s) => ({
              foodId: id,
              label: s.label,
              grams: String(s.grams),
            }))
          );
        }
      }

      return { success: true };
    }),
});
