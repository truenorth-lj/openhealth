// Centralized mapping: nutrient key (used in food data files) → DB nutrient_definitions.name
export const NUTRIENT_KEY_TO_NAME: Record<string, string> = {
  protein: "Protein",
  fat: "Total Fat",
  saturatedFat: "Saturated Fat",
  transFat: "Trans Fat",
  carbs: "Total Carbohydrate",
  sugar: "Total Sugars",
  fiber: "Dietary Fiber",
  sodium: "Sodium",
  potassium: "Potassium",
};
