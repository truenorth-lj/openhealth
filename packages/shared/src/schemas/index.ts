import { z } from "zod";
import { MAX_STEPS } from "../constants";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式需為 YYYY-MM-DD");

export const logFoodSchema = z.object({
  date: dateString,
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodId: z.string().uuid(),
  servingQty: z.number().positive(),
  servingId: z.string().uuid().optional(),
});

export const createFoodSchema = z.object({
  name: z.string().min(1).max(500),
  brand: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
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

export const updateFoodSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(500).optional(),
  brand: z.string().max(255).nullish(),
  description: z.string().max(2000).nullish(),
  servingSize: z.number().positive().optional(),
  servingUnit: z.string().min(1).max(50).optional(),
  householdServing: z.string().max(100).nullish(),
  calories: z.number().min(0).optional(),
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
  date: dateString,
  weightKg: z.number().positive().max(500),
  note: z.string().max(500).optional(),
});

export const logStepsSchema = z.object({
  date: dateString,
  steps: z.number().int().min(0).max(MAX_STEPS),
  note: z.string().max(500).optional(),
});

export const logMeasurementsSchema = z.object({
  date: dateString,
  waistCm: z.number().positive().optional(),
  hipCm: z.number().positive().optional(),
  chestCm: z.number().positive().optional(),
  armCm: z.number().positive().optional(),
  thighCm: z.number().positive().optional(),
  neckCm: z.number().positive().optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  note: z.string().max(500).optional(),
});

export const createFoodFromBarcodeSchema = z.object({
  barcode: z.string().min(1),
  name: z.string().min(1).max(500),
  brand: z.string().max(255).optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string().min(1).max(50),
  calories: z.number().min(0),
  protein: z.number().min(0),
  fat: z.number().min(0),
  carbs: z.number().min(0),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  saturatedFat: z.number().min(0).optional(),
  transFat: z.number().min(0).optional(),
  cholesterol: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  imageUrl: z.string().optional(),
});

export const copyMealSchema = z.object({
  fromDate: dateString,
  toDate: dateString,
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

export const removeEntrySchema = z.object({
  entryId: z.string().uuid(),
});

export const applyReferralCodeSchema = z.object({
  code: z
    .string()
    .min(4)
    .max(12)
    .regex(/^[A-Z0-9]+$/i, "推薦碼只能包含英文字母和數字"),
});

export const customizeReferralCodeSchema = z.object({
  code: z
    .string()
    .min(4)
    .max(12)
    .regex(/^[A-Z0-9]+$/i, "推薦碼只能包含英文字母和數字"),
});
