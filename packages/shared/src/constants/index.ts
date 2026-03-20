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
  vitaminA: 12,
  vitaminC: 13,
  vitaminD: 14,
  calcium: 26,
  iron: 27,
  potassium: 30,
  sodium: 31,
} as const;

// Macro nutrient IDs already shown in the daily summary (protein, fat, carbs, fiber)
export const MACRO_NUTRIENT_IDS: readonly number[] = [
  NUTRIENT_IDS.protein,
  NUTRIENT_IDS.totalFat,
  NUTRIENT_IDS.totalCarbs,
  NUTRIENT_IDS.fiber,
];

export const NUTRIENT_CATEGORY_LABELS: Record<string, string> = {
  macro: "巨量營養素",
  vitamin: "維生素",
  mineral: "礦物質",
  other: "其他",
};

// DB nutrient name → i18n key mapping (for use with nutrients.json translations)
export const NUTRIENT_I18N_KEY: Record<string, string> = {
  Protein: "protein",
  "Total Fat": "totalFat",
  "Total Carbohydrate": "totalCarbohydrate",
  "Dietary Fiber": "dietaryFiber",
  "Total Sugars": "totalSugars",
  "Added Sugars": "addedSugars",
  "Saturated Fat": "saturatedFat",
  "Trans Fat": "transFat",
  "Monounsaturated Fat": "monounsaturatedFat",
  "Polyunsaturated Fat": "polyunsaturatedFat",
  Cholesterol: "cholesterol",
  "Vitamin A": "vitaminA",
  "Vitamin C": "vitaminC",
  "Vitamin D": "vitaminD",
  "Vitamin E": "vitaminE",
  "Vitamin K": "vitaminK",
  "Thiamin (B1)": "vitaminB1",
  "Riboflavin (B2)": "vitaminB2",
  "Niacin (B3)": "vitaminB3",
  "Pantothenic Acid (B5)": "vitaminB5",
  "Vitamin B6": "vitaminB6",
  "Biotin (B7)": "vitaminB7",
  "Folate (B9)": "vitaminB9",
  "Vitamin B12": "vitaminB12",
  Choline: "choline",
  Calcium: "calcium",
  Iron: "iron",
  Magnesium: "magnesium",
  Phosphorus: "phosphorus",
  Potassium: "potassium",
  Sodium: "sodium",
  Zinc: "zinc",
  Copper: "copper",
  Manganese: "manganese",
  Selenium: "selenium",
  Chromium: "chromium",
  Molybdenum: "molybdenum",
  Iodine: "iodine",
  Water: "water",
  Caffeine: "caffeine",
  Alcohol: "alcohol",
};

// Nutrient name translations (English → Traditional Chinese)
export const NUTRIENT_NAME_ZH: Record<string, string> = {
  // 巨量營養素
  Protein: "蛋白質",
  "Total Fat": "總脂肪",
  "Total Carbohydrate": "總碳水化合物",
  "Dietary Fiber": "膳食纖維",
  "Total Sugars": "總糖",
  "Added Sugars": "添加糖",
  "Saturated Fat": "飽和脂肪",
  "Trans Fat": "反式脂肪",
  "Monounsaturated Fat": "單元不飽和脂肪",
  "Polyunsaturated Fat": "多元不飽和脂肪",
  Cholesterol: "膽固醇",
  // 維生素
  "Vitamin A": "維生素 A",
  "Vitamin C": "維生素 C",
  "Vitamin D": "維生素 D",
  "Vitamin E": "維生素 E",
  "Vitamin K": "維生素 K",
  "Thiamin (B1)": "硫胺素 (B1)",
  "Riboflavin (B2)": "核黃素 (B2)",
  "Niacin (B3)": "菸鹼素 (B3)",
  "Pantothenic Acid (B5)": "泛酸 (B5)",
  "Vitamin B6": "維生素 B6",
  "Biotin (B7)": "生物素 (B7)",
  "Folate (B9)": "葉酸 (B9)",
  "Vitamin B12": "維生素 B12",
  Choline: "膽鹼",
  // 礦物質
  Calcium: "鈣",
  Iron: "鐵",
  Magnesium: "鎂",
  Phosphorus: "磷",
  Potassium: "鉀",
  Sodium: "鈉",
  Zinc: "鋅",
  Copper: "銅",
  Manganese: "錳",
  Selenium: "硒",
  Chromium: "鉻",
  Molybdenum: "鉬",
  Iodine: "碘",
  // 其他
  Water: "水分",
  Caffeine: "咖啡因",
  Alcohol: "酒精",
};

export const DEFAULT_SERVING_SIZE = 100;

export const PLANS = ["free", "pro"] as const;
export const AI_FEATURES = ["ocr", "estimate", "chat"] as const;

export const PLAN_LIMITS = {
  free: {
    ai: { ocr: 3, estimate: 3, chat: 10 },
    micronutrients: false,
    exercise: false,
    fasting: false,
    progressPhotos: false,
    exportData: false,
    savedMealsLimit: 0,
  },
  pro: {
    ai: { ocr: Infinity, estimate: Infinity, chat: 100 },
    micronutrients: true,
    exercise: true,
    fasting: true,
    progressPhotos: true,
    exportData: true,
    savedMealsLimit: Infinity,
  },
} as const;

export const CHAT_DAILY_LIMIT = 100;
export const CHAT_CONVERSATION_LIMIT = 5;

export const DEFAULT_CALORIE_TARGET = 2000;
export const DEFAULT_PROTEIN_G = 150;
export const DEFAULT_CARBS_G = 250;
export const DEFAULT_FAT_G = 67;
export const DEFAULT_FIBER_G = 28;

export const DEFAULT_WATER_GOAL_ML = 2500;
export const MAX_STEPS = 200000;

export const EXERCISE_CATEGORIES = ["cardio", "strength", "flexibility", "sport", "other"] as const;
export const EXERCISE_INTENSITIES = ["low", "moderate", "high"] as const;
export const DEFAULT_EXERCISE_CALORIE_GOAL = 300;
export const DEFAULT_WEIGHT_KG = 70;

export const EXERCISE_CATEGORY_LABELS: Record<string, string> = {
  cardio: "有氧",
  strength: "肌力",
  flexibility: "柔軟度",
  sport: "運動",
  other: "其他",
};

export const EXERCISE_INTENSITY_LABELS: Record<string, string> = {
  low: "低",
  moderate: "中",
  high: "高",
};

// Workout tracking
export const REST_TIMER_OPTIONS = [30, 60, 90, 120, 180] as const;
export const PR_TYPES = ["weight", "1rm", "volume", "reps"] as const;
export const SET_TYPES = ["normal", "warmup", "dropset"] as const;

export const SET_TYPE_LABELS: Record<string, string> = {
  normal: "正式組",
  warmup: "暖身組",
  dropset: "遞減組",
};

export const APP_NAME = "Open Health";
export const THEME_COLOR = "#16a34a";
export const DANGER_COLOR = "#ef4444";

// Referral system
export const REFERRAL = {
  REFEREE_TRIAL_DAYS: 14,
  REFERRER_FREE_DAYS: 30,
  MAX_TRIAL_DAYS: 365,
  REVENUE_SHARE_PERCENTAGE: 0.25,
  REVENUE_SHARE_CONFIRM_DAYS: 90,
  MIN_PAYOUT_CENTS: 500, // $5
} as const;

export const PAYOUT_METHODS = [
  "subscription_credit",
  "bank_transfer",
] as const;

export type PayoutMethod = (typeof PAYOUT_METHODS)[number];
export type RefereeStatus = "paid" | "trial" | "registered";

export const REWARD_TYPES = {
  FREE_DAYS: "free_days",
  REVENUE_SHARE: "revenue_share",
} as const;

export type RewardType = (typeof REWARD_TYPES)[keyof typeof REWARD_TYPES];

export const REWARD_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PAID: "paid",
  CLAWED_BACK: "clawed_back",
} as const;

export type RewardStatus = (typeof REWARD_STATUSES)[keyof typeof REWARD_STATUSES];

// Fasting protocols
export const FASTING_PROTOCOLS = [
  { value: "16_8" as const, label: "16:8", fasting: 16, eating: 8, desc: "16 小時斷食 / 8 小時進食" },
  { value: "18_6" as const, label: "18:6", fasting: 18, eating: 6, desc: "18 小時斷食 / 6 小時進食" },
  { value: "20_4" as const, label: "20:4", fasting: 20, eating: 4, desc: "20 小時斷食 / 4 小時進食" },
  { value: "omad" as const, label: "OMAD", fasting: 23, eating: 1, desc: "每天只吃一餐" },
] as const;

export type FastingProtocol = (typeof FASTING_PROTOCOLS)[number]["value"];

// Sleep tracking
export const SLEEP_PHASES = ["awake", "light", "deep", "rem"] as const;
export const SLEEP_DETECTION_METHODS = ["accelerometer", "microphone", "both"] as const;

export const SLEEP_PHASE_LABELS: Record<string, string> = {
  awake: "清醒",
  light: "淺睡",
  deep: "深睡",
  rem: "REM",
};

export const SLEEP_PHASE_COLORS: Record<string, string> = {
  awake: "#ef4444",
  light: "#60a5fa",
  deep: "#1e40af",
  rem: "#a78bfa",
};

export const SLEEP_FACTORS = [
  { id: "caffeine", label: "\u5496\u5561\u56e0", icon: "\u2615" },
  { id: "alcohol", label: "\u9152\u7cbe", icon: "\ud83c\udf77" },
  { id: "exercise", label: "\u904b\u52d5", icon: "\ud83c\udfc3" },
  { id: "stress", label: "\u58d3\u529b\u5927", icon: "\ud83d\ude30" },
  { id: "late_meal", label: "\u5403\u592a\u665a", icon: "\ud83c\udf7d\ufe0f" },
  { id: "screen_time", label: "\u9577\u6642\u9593\u7528\u624b\u6a5f", icon: "\ud83d\udcf1" },
  { id: "reading", label: "\u95b1\u8b80", icon: "\ud83d\udcd6" },
  { id: "meditation", label: "\u51a5\u60f3", icon: "\ud83e\uddd8" },
  { id: "medication", label: "\u85e5\u7269", icon: "\ud83d\udc8a" },
  { id: "sick", label: "\u8eab\u9ad4\u4e0d\u9069", icon: "\ud83e\udd27" },
  { id: "travel", label: "\u51fa\u5dee/\u65c5\u884c", icon: "\u2708\ufe0f" },
] as const;

export type SleepFactorId = (typeof SLEEP_FACTORS)[number]["id"];

// Activity sessions (shared exercise + meditation)
export const ACTIVITY_TYPES = ["exercise", "meditation"] as const;

// Meditation
export const MEDITATION_TYPES = [
  "mindfulness",
  "breathing",
  "body_scan",
] as const;

export const MEDITATION_TYPE_LABELS: Record<string, string> = {
  mindfulness: "正念冥想",
  breathing: "呼吸練習",
  body_scan: "身體掃描",
};

export const MEDITATION_SESSION_MODES = ["guided", "unguided", "timer"] as const;

export const MEDITATION_SESSION_MODE_LABELS: Record<string, string> = {
  guided: "引導式",
  unguided: "自由練習",
  timer: "計時器",
};

export const MOOD_LEVELS = [1, 2, 3, 4, 5] as const;
export const MOOD_LEVEL_LABELS: Record<number, string> = {
  1: "非常差",
  2: "不好",
  3: "一般",
  4: "不錯",
  5: "非常好",
};

export const FEELING_TAGS = [
  "anxious",
  "stressed",
  "sad",
  "angry",
  "tired",
  "restless",
  "scattered",
  "overwhelmed",
  "calm",
  "happy",
  "grateful",
  "focused",
  "energized",
  "peaceful",
  "hopeful",
  "content",
  "relaxed",
  "clear",
] as const;

export const FEELING_TAG_LABELS: Record<string, string> = {
  anxious: "焦慮",
  stressed: "壓力大",
  sad: "難過",
  angry: "生氣",
  tired: "疲倦",
  restless: "不安",
  scattered: "心散",
  overwhelmed: "壓力爆表",
  calm: "平靜",
  happy: "開心",
  grateful: "感恩",
  focused: "專注",
  energized: "有活力",
  peaceful: "祥和",
  hopeful: "充滿希望",
  content: "滿足",
  relaxed: "放鬆",
  clear: "清晰",
};

export const MEDITATION_DURATION_PRESETS = [300, 600, 900, 1200, 1800] as const; // 5, 10, 15, 20, 30 min

export const DEFAULT_SLEEP_GOAL_HOURS = 8;
export const DEFAULT_ALARM_WINDOW_MINUTES = 30;
export const SLEEP_SAMPLE_INTERVAL_MS = 1000;
export const SLEEP_EPOCH_DURATION_MS = 60_000;
