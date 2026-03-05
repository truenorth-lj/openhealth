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

export const APP_NAME = "Open Health";
export const THEME_COLOR = "#16a34a";
export const DANGER_COLOR = "#ef4444";
