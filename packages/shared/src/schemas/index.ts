import { z } from "zod";

export const logFoodSchema = z.object({
  date: z.string(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodId: z.string().uuid(),
  servingQty: z.number().positive(),
  servingId: z.string().uuid().optional(),
});

export const createFoodSchema = z.object({
  name: z.string().min(1).max(500),
  brand: z.string().max(255).optional(),
  barcode: z.string().max(50).optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string().min(1).max(50),
  householdServing: z.string().max(100).optional(),
  calories: z.number().min(0),
  nutrients: z
    .array(
      z.object({
        nutrientId: z.number(),
        amount: z.number().min(0),
      })
    )
    .optional(),
  alternateServings: z
    .array(
      z.object({
        label: z.string(),
        grams: z.number().positive(),
      })
    )
    .optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  sex: z.enum(["male", "female", "other"]).nullable(),
  heightCm: z.number().positive().max(300).nullable(),
  dateOfBirth: z.string().nullable(),
  activityLevel: z
    .enum([
      "sedentary",
      "lightly_active",
      "moderately_active",
      "very_active",
      "extremely_active",
    ])
    .nullable(),
});

export const updateGoalsSchema = z.object({
  calorieTarget: z.number().int().positive().max(20000).nullable(),
  proteinG: z.number().nonnegative().max(2000).nullable(),
  carbsG: z.number().nonnegative().max(2000).nullable(),
  fatG: z.number().nonnegative().max(2000).nullable(),
  fiberG: z.number().nonnegative().max(500).nullable(),
});

export const logWeightSchema = z.object({
  date: z.string(),
  weightKg: z.number().positive().max(500),
  note: z.string().max(500).optional(),
});
