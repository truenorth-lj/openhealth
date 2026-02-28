import type {
  MEAL_TYPES,
  FOOD_SOURCES,
  ACTIVITY_LEVELS,
  GOAL_TYPES,
  SEXES,
  NUTRIENT_CATEGORIES,
  UNIT_SYSTEMS,
  TARGET_MODES,
} from "../constants";

export type MealType = (typeof MEAL_TYPES)[number];
export type FoodSource = (typeof FOOD_SOURCES)[number];
export type NutrientCategory = (typeof NUTRIENT_CATEGORIES)[number];
export type Sex = (typeof SEXES)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type GoalType = (typeof GOAL_TYPES)[number];
export type UnitSystem = (typeof UNIT_SYSTEMS)[number];
export type TargetMode = (typeof TARGET_MODES)[number];

export interface NutritionData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
}

export type OpenFoodFactsResult = {
  found: boolean;
  name?: string;
  brand?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  imageUrl?: string;
};
