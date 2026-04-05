// en resources — imported separately to enable tree-shaking per language
import common from "./locales/en/common.json";
import diary from "./locales/en/diary.json";
import food from "./locales/en/food.json";
import exercise from "./locales/en/exercise.json";
import sleep from "./locales/en/sleep.json";
import water from "./locales/en/water.json";
import weight from "./locales/en/weight.json";
import progress from "./locales/en/progress.json";
import settings from "./locales/en/settings.json";
import nutrients from "./locales/en/nutrients.json";
import ai from "./locales/en/ai.json";
import fasting from "./locales/en/fasting.json";
import workout from "./locales/en/workout.json";
import posture from "./locales/en/posture.json";
import landing from "./locales/en/landing.json";
import blog from "./locales/en/blog.json";
import docs from "./locales/en/docs.json";
import privacy from "./locales/en/privacy.json";
import coach from "./locales/en/coach.json";
import pricing from "./locales/en/pricing.json";
import meditation from "./locales/en/meditation.json";
import throatExercise from "./locales/en/throat-exercise.json";
import eyeExercise from "./locales/en/eye-exercise.json";
import documents from "./locales/en/documents.json";

export const enResources = {
  common,
  diary,
  food,
  exercise,
  sleep,
  water,
  weight,
  progress,
  settings,
  nutrients,
  ai,
  fasting,
  workout,
  posture,
  landing,
  blog,
  docs,
  privacy,
  coach,
  pricing,
  meditation,
  "throat-exercise": throatExercise,
  "eye-exercise": eyeExercise,
  documents,
} as const;
