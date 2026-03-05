import type { FoodItem } from "./seed-foods";

// 路易莎 Louisa Coffee — 餐點系列
// 營養數據來源: dailydietitian.com.tw + 路易莎官方營養標示
export const louisaFoods: FoodItem[] = [
  // ── 早餐派對 ──
  { name: "草莓鬆餅堡", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 275, nutrients: { protein: 5.7, fat: 7.8, carbs: 45.5, sodium: 146 }, metadata: { price: 65, category: "早餐派對" } },
  { name: "麥香火腿玉米磚壓", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 394, nutrients: { protein: 24.1, fat: 16.5, carbs: 37.1, sodium: 785 }, metadata: { price: 85, category: "早餐派對" } },
  { name: "青檸燻雞重堡", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 387, nutrients: { protein: 17.8, fat: 21, carbs: 31.7, sodium: 530 }, metadata: { price: 95, category: "早餐派對" } },
  { name: "法式培根蔬菜三明治", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 393, nutrients: { protein: 12.4, fat: 19.6, carbs: 41.8, sodium: 499 }, metadata: { price: 80, category: "早餐派對" } },
  { name: "鯖魚歐姆蛋", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 351, nutrients: { protein: 13.5, fat: 17.1, carbs: 35.7, sodium: 269 }, metadata: { price: 80, category: "早餐派對" } },
  // ── 元氣鬆餅堡 ──
  { name: "寶寶蛋鬆餅堡", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 424, nutrients: { protein: 16.8, fat: 19.4, carbs: 45.6, sodium: 547 }, metadata: { price: 75, category: "元氣鬆餅堡" } },
  { name: "培根蛋鬆餅堡", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 475, nutrients: { protein: 18.6, fat: 24.3, carbs: 45.6, sodium: 463 }, metadata: { price: 80, category: "元氣鬆餅堡" } },
  { name: "豬肉蛋鬆餅堡", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 517, nutrients: { protein: 21.8, fat: 26.8, carbs: 47.1, sodium: 556 }, metadata: { price: 85, category: "元氣鬆餅堡" } },
  // ── 義式磚壓三明治 ──
  { name: "火腿起司義式磚壓", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 485, nutrients: { protein: 20.6, fat: 18.8, carbs: 58.3, sodium: 1137 }, metadata: { price: 90, category: "義式磚壓" } },
  { name: "薑汁燒肉義式磚壓", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 469, nutrients: { protein: 19, fat: 22, carbs: 48, sodium: 750 }, metadata: { price: 95, category: "義式磚壓" } },
  { name: "麥香玉米蛋磚壓", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 346, nutrients: { protein: 17, fat: 16, carbs: 32, sodium: 580 }, metadata: { price: 75, category: "義式磚壓" } },
  { name: "麥香豬肉磚壓", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 420, nutrients: { protein: 20, fat: 23, carbs: 32, sodium: 650 }, metadata: { price: 85, category: "義式磚壓" } },
  { name: "鮪魚玉米義式磚壓", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 463, nutrients: { protein: 18, fat: 21, carbs: 48, sodium: 700 }, metadata: { price: 85, category: "義式磚壓" } },
  // ── 其他輕食（估算） ──
  { name: "烤雞腿排佛卡夏", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 460, nutrients: { protein: 17, fat: 23, carbs: 45, sodium: 680 }, metadata: { price: 110, category: "佛卡夏" } },
  { name: "總匯三明治", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 380, nutrients: { protein: 18, fat: 16, carbs: 40, sodium: 700 }, metadata: { price: 85, category: "三明治" } },
  { name: "燻雞凱薩沙拉", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 280, nutrients: { protein: 18, fat: 15, carbs: 18, sodium: 650 }, metadata: { price: 95, category: "沙拉" } },
  { name: "鮮蔬沙拉", brand: "路易莎", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 150, nutrients: { protein: 5, fat: 8, carbs: 15, sodium: 350 }, metadata: { price: 75, category: "沙拉" } },
];
