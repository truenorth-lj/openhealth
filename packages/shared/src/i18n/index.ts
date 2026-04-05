// Shared i18n resources and configuration
// Consumed by apps/web and apps/mobile i18n init files

import zhTWCommon from "./locales/zh-TW/common.json";
import zhTWDiary from "./locales/zh-TW/diary.json";
import zhTWFood from "./locales/zh-TW/food.json";
import zhTWExercise from "./locales/zh-TW/exercise.json";
import zhTWSleep from "./locales/zh-TW/sleep.json";
import zhTWWater from "./locales/zh-TW/water.json";
import zhTWWeight from "./locales/zh-TW/weight.json";
import zhTWProgress from "./locales/zh-TW/progress.json";
import zhTWSettings from "./locales/zh-TW/settings.json";
import zhTWNutrients from "./locales/zh-TW/nutrients.json";
import zhTWAi from "./locales/zh-TW/ai.json";
import zhTWFasting from "./locales/zh-TW/fasting.json";
import zhTWWorkout from "./locales/zh-TW/workout.json";
import zhTWPosture from "./locales/zh-TW/posture.json";
import zhTWLanding from "./locales/zh-TW/landing.json";
import zhTWBlog from "./locales/zh-TW/blog.json";
import zhTWDocs from "./locales/zh-TW/docs.json";
import zhTWPrivacy from "./locales/zh-TW/privacy.json";
import zhTWCoach from "./locales/zh-TW/coach.json";
import zhTWPricing from "./locales/zh-TW/pricing.json";
import zhTWMeditation from "./locales/zh-TW/meditation.json";
import zhTWReminders from "./locales/zh-TW/reminders.json";
import zhTWThroatExercise from "./locales/zh-TW/throat-exercise.json";
import zhTWEyeExercise from "./locales/zh-TW/eye-exercise.json";
import zhTWSteps from "./locales/zh-TW/steps.json";
import zhTWDocuments from "./locales/zh-TW/documents.json";

import enCommon from "./locales/en/common.json";
import enDiary from "./locales/en/diary.json";
import enFood from "./locales/en/food.json";
import enExercise from "./locales/en/exercise.json";
import enSleep from "./locales/en/sleep.json";
import enWater from "./locales/en/water.json";
import enWeight from "./locales/en/weight.json";
import enProgress from "./locales/en/progress.json";
import enSettings from "./locales/en/settings.json";
import enNutrients from "./locales/en/nutrients.json";
import enAi from "./locales/en/ai.json";
import enFasting from "./locales/en/fasting.json";
import enWorkout from "./locales/en/workout.json";
import enPosture from "./locales/en/posture.json";
import enLanding from "./locales/en/landing.json";
import enBlog from "./locales/en/blog.json";
import enDocs from "./locales/en/docs.json";
import enPrivacy from "./locales/en/privacy.json";
import enCoach from "./locales/en/coach.json";
import enPricing from "./locales/en/pricing.json";
import enMeditation from "./locales/en/meditation.json";
import enReminders from "./locales/en/reminders.json";
import enThroatExercise from "./locales/en/throat-exercise.json";
import enEyeExercise from "./locales/en/eye-exercise.json";
import enSteps from "./locales/en/steps.json";
import enDocuments from "./locales/en/documents.json";

export const supportedLngs = ["zh-TW", "en"] as const;
export type SupportedLanguage = (typeof supportedLngs)[number];

export const fallbackLng = "zh-TW" as const;
export const defaultNS = "common" as const;

export const namespaces = [
  "common",
  "diary",
  "food",
  "exercise",
  "sleep",
  "water",
  "weight",
  "progress",
  "settings",
  "nutrients",
  "ai",
  "fasting",
  "workout",
  "posture",
  "landing",
  "blog",
  "docs",
  "privacy",
  "coach",
  "pricing",
  "meditation",
  "reminders",
  "throat-exercise",
  "eye-exercise",
  "steps",
  "documents",
] as const;

export type Namespace = (typeof namespaces)[number];

export const resources = {
  "zh-TW": {
    common: zhTWCommon,
    diary: zhTWDiary,
    food: zhTWFood,
    exercise: zhTWExercise,
    sleep: zhTWSleep,
    water: zhTWWater,
    weight: zhTWWeight,
    progress: zhTWProgress,
    settings: zhTWSettings,
    nutrients: zhTWNutrients,
    ai: zhTWAi,
    fasting: zhTWFasting,
    workout: zhTWWorkout,
    posture: zhTWPosture,
    landing: zhTWLanding,
    blog: zhTWBlog,
    docs: zhTWDocs,
    privacy: zhTWPrivacy,
    coach: zhTWCoach,
    pricing: zhTWPricing,
    meditation: zhTWMeditation,
    reminders: zhTWReminders,
    "throat-exercise": zhTWThroatExercise,
    "eye-exercise": zhTWEyeExercise,
    steps: zhTWSteps,
    documents: zhTWDocuments,
  },
  en: {
    common: enCommon,
    diary: enDiary,
    food: enFood,
    exercise: enExercise,
    sleep: enSleep,
    water: enWater,
    weight: enWeight,
    progress: enProgress,
    settings: enSettings,
    nutrients: enNutrients,
    ai: enAi,
    fasting: enFasting,
    workout: enWorkout,
    posture: enPosture,
    landing: enLanding,
    blog: enBlog,
    docs: enDocs,
    privacy: enPrivacy,
    coach: enCoach,
    pricing: enPricing,
    meditation: enMeditation,
    reminders: enReminders,
    "throat-exercise": enThroatExercise,
    "eye-exercise": enEyeExercise,
    steps: enSteps,
    documents: enDocuments,
  },
} as const;
