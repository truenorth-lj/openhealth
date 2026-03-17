import type {
  MEAL_TYPES,
  FOOD_SOURCES,
  ACTIVITY_LEVELS,
  GOAL_TYPES,
  SEXES,
  NUTRIENT_CATEGORIES,
  UNIT_SYSTEMS,
  TARGET_MODES,
  PLANS,
  AI_FEATURES,
  EXERCISE_CATEGORIES,
  EXERCISE_INTENSITIES,
} from "../constants";

export type MealType = (typeof MEAL_TYPES)[number];
export type FoodSource = (typeof FOOD_SOURCES)[number];
export type NutrientCategory = (typeof NUTRIENT_CATEGORIES)[number];
export type Sex = (typeof SEXES)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type GoalType = (typeof GOAL_TYPES)[number];
export type UnitSystem = (typeof UNIT_SYSTEMS)[number];
export type TargetMode = (typeof TARGET_MODES)[number];
export type Plan = (typeof PLANS)[number];
export type AiFeature = (typeof AI_FEATURES)[number];
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];
export type ExerciseIntensity = (typeof EXERCISE_INTENSITIES)[number];

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

export type NutritionRecognitionResult = {
  foodName: string;
  brand?: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sodiumMg?: number | null;
  sugarG?: number | null;
  fiberG?: number | null;
  saturatedFatG?: number | null;
  transFatG?: number | null;
  cholesterolMg?: number | null;
  calciumMg?: number | null;
  ironMg?: number | null;
  potassiumMg?: number | null;
  vitaminAMcg?: number | null;
  vitaminCMg?: number | null;
  vitaminDMcg?: number | null;
  notes?: string | null;
  inferredFields?: string[];
};

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

// Activity sessions
import type {
  ACTIVITY_TYPES,
  MEDITATION_TYPES,
  MEDITATION_SESSION_MODES,
  FEELING_TAGS,
} from "../constants";

export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type MeditationType = (typeof MEDITATION_TYPES)[number];
export type MeditationSessionMode = (typeof MEDITATION_SESSION_MODES)[number];
export type FeelingTag = (typeof FEELING_TAGS)[number];

export interface MeditationMetadata {
  meditationType: MeditationType;
  sessionMode: MeditationSessionMode;
  plannedDurationSec?: number;
  completed?: boolean;
  moodBefore?: number;
  moodAfter?: number;
  feelingsBefore?: FeelingTag[];
  feelingsAfter?: FeelingTag[];
}

export interface ExerciseSessionMetadata {
  exerciseId?: string;
  exerciseName?: string;
  intensity?: string;
  caloriesBurned?: number;
}

// Sleep tracking
import type { SLEEP_PHASES, SLEEP_DETECTION_METHODS } from "../constants";

export type SleepPhase = (typeof SLEEP_PHASES)[number];
export type SleepDetectionMethod = (typeof SLEEP_DETECTION_METHODS)[number];

export interface SleepSessionSummary {
  startTime: string;
  endTime: string;
  sleepOnset: string;
  wakeTime: string;
  durationMinutes: number;
  quality: number;
  detectionMethod: SleepDetectionMethod;
  phases: SleepPhasePeriod[];
  factors?: string[];
}

export interface SleepPhasePeriod {
  startTime: string;
  endTime: string;
  phase: SleepPhase;
}

export interface SleepMovementSample {
  timestamp: number;
  intensity: number;
}

export interface SleepAudioSample {
  timestamp: number;
  decibels: number;
}
