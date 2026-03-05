import type { FoodItem } from "./seed-foods";

// 星巴克 Starbucks Taiwan — 輕食 + 糕點
// 熱量數據來源: i-fit.com.tw + nutrition168.com + 星巴克官方
// 巨量營養素部分為根據品項類型估算
export const starbucksFoods: FoodItem[] = [
  // ── 輕食 Light Meals ──
  { name: "經典總匯三明治", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 513, nutrients: { protein: 22, fat: 28, carbs: 42, sodium: 980 }, metadata: { price: 145, category: "輕食" } },
  { name: "松露烤雞義大利麵", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 537, nutrients: { protein: 22, fat: 20, carbs: 66, sodium: 850 }, metadata: { price: 155, category: "輕食" } },
  { name: "櫛瓜肉醬義大利麵", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 477, nutrients: { protein: 18, fat: 17, carbs: 62, sodium: 780 }, metadata: { price: 145, category: "輕食" } },
  { name: "起司里肌可頌", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 402, nutrients: { protein: 16, fat: 22, carbs: 36, sodium: 720 }, metadata: { price: 100, category: "輕食" } },
  { name: "起司牛肉可頌", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 388, nutrients: { protein: 17, fat: 20, carbs: 34, sodium: 750 }, metadata: { price: 100, category: "輕食" } },
  { name: "青醬雞肉吐司", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 285, nutrients: { protein: 15, fat: 10, carbs: 34, sodium: 620 }, metadata: { price: 95, category: "輕食" } },
  { name: "水牛城辣雞三明治", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 341, nutrients: { protein: 18, fat: 14, carbs: 35, sodium: 780 }, metadata: { price: 110, category: "輕食" } },
  { name: "羅勒蔬菜肉三明治", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 352, nutrients: { protein: 14, fat: 16, carbs: 38, sodium: 650 }, metadata: { price: 105, category: "輕食" } },
  { name: "烤雞鮮蔬吐司三明治", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 342, nutrients: { protein: 18, fat: 12, carbs: 40, sodium: 700 }, metadata: { price: 105, category: "輕食" } },
  { name: "義式雞肉起司堡", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 233, nutrients: { protein: 14, fat: 8, carbs: 27, sodium: 550 }, metadata: { price: 85, category: "輕食" } },
  { name: "照燒雞三明治", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 287, nutrients: { protein: 15, fat: 10, carbs: 34, sodium: 680 }, metadata: { price: 95, category: "輕食" } },
  { name: "燻雞蛋鬆餅", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 261, nutrients: { protein: 13, fat: 10, carbs: 30, sodium: 580 }, metadata: { price: 85, category: "輕食" } },
  { name: "田園雞帕里尼", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 512, nutrients: { protein: 24, fat: 22, carbs: 52, sodium: 920 }, metadata: { price: 130, category: "輕食" } },
  { name: "法式燻火腿三明治", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 251, nutrients: { protein: 12, fat: 10, carbs: 28, sodium: 700 }, metadata: { price: 90, category: "輕食" } },
  { name: "黑松露軟蛋三明治", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "份", householdServing: "一份", calories: 275, nutrients: { protein: 12, fat: 12, carbs: 30, sodium: 520 }, metadata: { price: 105, category: "輕食" } },
  // ── 甜點 / 糕點 Pastries ──
  { name: "肉桂捲", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "個", householdServing: "一個", calories: 397, nutrients: { protein: 6, fat: 16, carbs: 58, sodium: 350 }, metadata: { price: 85, category: "麵包糕點" } },
  { name: "海鹽奶油捲", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "個", householdServing: "一個", calories: 167, nutrients: { protein: 4, fat: 7, carbs: 22, sodium: 280 }, metadata: { price: 55, category: "麵包糕點" } },
  { name: "雙重起司軟法", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "個", householdServing: "一個", calories: 322, nutrients: { protein: 12, fat: 14, carbs: 36, sodium: 520 }, metadata: { price: 75, category: "麵包糕點" } },
  { name: "藍莓穀物貝果", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "個", householdServing: "一個", calories: 248, nutrients: { protein: 8, fat: 4, carbs: 46, sodium: 380 }, metadata: { price: 65, category: "麵包糕點" } },
  { name: "法式可頌", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "個", householdServing: "一個", calories: 203, nutrients: { protein: 4, fat: 11, carbs: 22, sodium: 250 }, metadata: { price: 55, category: "麵包糕點" } },
  { name: "經典起司蛋糕", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "片", householdServing: "一片", calories: 439, nutrients: { protein: 8, fat: 33, carbs: 28, sodium: 320 }, metadata: { price: 140, category: "蛋糕甜點" } },
  { name: "可麗露", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "個", householdServing: "一個", calories: 130, nutrients: { protein: 3, fat: 2.8, carbs: 23.6, sodium: 85 }, metadata: { price: 55, category: "蛋糕甜點" } },
  { name: "藍莓波士頓派", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "片", householdServing: "一片", calories: 189, nutrients: { protein: 4, fat: 11.4, carbs: 19.1, sodium: 120 }, metadata: { price: 95, category: "蛋糕甜點" } },
  { name: "馬斯卡邦輕乳酪蛋糕", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "片", householdServing: "一片", calories: 195, nutrients: { protein: 5, fat: 14.3, carbs: 12.3, sodium: 150 }, metadata: { price: 120, category: "蛋糕甜點" } },
  { name: "巧克力司康", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "個", householdServing: "一個", calories: 429, nutrients: { protein: 7, fat: 17.4, carbs: 58.1, sodium: 400 }, metadata: { price: 75, category: "麵包糕點" } },
  { name: "檸檬塔", brand: "星巴克", source: "verified", servingSize: 1, servingUnit: "個", householdServing: "一個", calories: 259, nutrients: { protein: 3, fat: 11.7, carbs: 34, sodium: 180 }, metadata: { price: 95, category: "蛋糕甜點" } },
];
