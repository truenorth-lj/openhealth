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
  },
} as const;
