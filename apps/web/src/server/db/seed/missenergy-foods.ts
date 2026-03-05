import type { FoodItem } from "./seed-foods";

// Miss Energy 能量小姐 — 健康水煮餐盒
// 全台 20+ 分店，營養師設計
// 熱量來源: 官網 missenergy.com.tw
// 巨量營養素為根據健康水煮餐盒典型組成估算
// 餐盒含紫米飯 + 地瓜 + 半顆水煮蛋 + 三種蔬菜配菜
export const missEnergyFoods: FoodItem[] = [
  { name: "水煮嫩雞胸 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 546, nutrients: { protein: 42, fat: 12, carbs: 68, fiber: 8, sodium: 650 }, metadata: { price: 130, category: "主食", caloriesHalfRice: 432 } },
  { name: "蒜泥豬里肌 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 470, nutrients: { protein: 35, fat: 12, carbs: 58, fiber: 7, sodium: 620 }, metadata: { price: 125, category: "主食", caloriesHalfRice: 357 } },
  { name: "泡菜豬里肌 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 469, nutrients: { protein: 34, fat: 12, carbs: 60, fiber: 7, sodium: 700 }, metadata: { price: 130, category: "主食", caloriesHalfRice: 355 } },
  { name: "鹽烤鯖魚 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 542, nutrients: { protein: 38, fat: 18, carbs: 58, fiber: 7, sodium: 680 }, metadata: { price: 135, category: "主食", caloriesHalfRice: 429 } },
  { name: "香滷雞腿 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 602, nutrients: { protein: 40, fat: 18, carbs: 68, fiber: 7, sodium: 750 }, metadata: { price: 135, category: "主食", caloriesHalfRice: 488 } },
  { name: "韓式菇菇雞 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 602, nutrients: { protein: 40, fat: 18, carbs: 68, fiber: 8, sodium: 720 }, metadata: { price: 130, category: "主食", caloriesHalfRice: 488 } },
  { name: "麻香口水雞 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 578, nutrients: { protein: 40, fat: 16, carbs: 66, fiber: 7, sodium: 700 }, metadata: { price: 130, category: "主食", caloriesHalfRice: 465 } },
  { name: "清滷牛腱 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 527, nutrients: { protein: 42, fat: 12, carbs: 62, fiber: 7, sodium: 680 }, metadata: { price: 195, category: "主食", caloriesHalfRice: 413 } },
  { name: "日式蔥鹽雞 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 350, nutrients: { protein: 32, fat: 6, carbs: 42, fiber: 7, sodium: 580 }, metadata: { price: 130, category: "主食", caloriesHalfRice: 237 } },
  { name: "泰式打拋雞 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 505, nutrients: { protein: 38, fat: 12, carbs: 62, fiber: 7, sodium: 750 }, metadata: { price: 135, category: "主食", caloriesHalfRice: 395 } },
  { name: "厚切牛肉排 餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 591, nutrients: { protein: 42, fat: 18, carbs: 62, fiber: 6, sodium: 720 }, metadata: { price: 150, category: "主食", caloriesHalfRice: 478 } },
  { name: "日式壽喜牛便當", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 686, nutrients: { protein: 40, fat: 24, carbs: 76, fiber: 6, sodium: 850 }, metadata: { price: 140, category: "主食", caloriesHalfRice: 572 } },
  { name: "菜飯餐盒", brand: "能量小姐", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 350, nutrients: { protein: 12, fat: 8, carbs: 58, fiber: 10, sodium: 450 }, metadata: { price: 100, category: "主食", caloriesHalfRice: 237 } },
];
