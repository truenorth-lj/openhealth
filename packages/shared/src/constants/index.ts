// Extracted from Drizzle schema enums — single source of truth

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export const FOOD_SOURCES = [
  "usda",
  "openfoodfacts",
  "user",
  "verified",
  "family",
  "seven",
] as const;

export const NUTRIENT_CATEGORIES = [
  "macro",
  "vitamin",
  "mineral",
  "other",
] as const;

export const SEXES = ["male", "female", "other"] as const;

export const ACTIVITY_LEVELS = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extremely_active",
] as const;

export const GOAL_TYPES = ["lose", "maintain", "gain"] as const;

export const UNIT_SYSTEMS = ["metric", "imperial"] as const;

export const TARGET_MODES = ["grams", "percentage"] as const;

// Nutrient IDs from seed data (serial order)
export const NUTRIENT_IDS = {
  protein: 1,
  totalFat: 2,
  totalCarbs: 3,
  fiber: 4,
  sugar: 5,
  saturatedFat: 7,
  transFat: 8,
  cholesterol: 11,
  sodium: 31,
} as const;

export const DEFAULT_SERVING_SIZE = 100;

export const APP_NAME = "Open Health";
export const THEME_COLOR = "#16a34a";
