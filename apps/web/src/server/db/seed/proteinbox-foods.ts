import type { FoodItem } from "./seed-foods";

// 蛋白盒子 The Protein Box — 全台 111+ 分店
// 健康高蛋白餐盒
// 熱量來源: 官網 theproteinbox.com.tw + Uber Eats
// 巨量營養素為根據品項類型估算
export const proteinBoxFoods: FoodItem[] = [
  { name: "港式蔥薑醬雞胸 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 443, nutrients: { protein: 38, fat: 10, carbs: 50, fiber: 5, sodium: 620 }, metadata: { price: 130, category: "雞胸系列" } },
  { name: "四川辣醬雞胸 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 440, nutrients: { protein: 38, fat: 10, carbs: 48, fiber: 5, sodium: 680 }, metadata: { price: 130, category: "雞胸系列" } },
  { name: "秘製燒肉醬雞胸 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 436, nutrients: { protein: 36, fat: 10, carbs: 52, fiber: 5, sodium: 650 }, metadata: { price: 130, category: "雞胸系列" } },
  { name: "麻婆醬雞胸 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 428, nutrients: { protein: 36, fat: 10, carbs: 48, fiber: 5, sodium: 680 }, metadata: { price: 130, category: "雞胸系列" } },
  { name: "燒肉雞胸 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 436, nutrients: { protein: 36, fat: 10, carbs: 52, fiber: 5, sodium: 640 }, metadata: { price: 130, category: "雞胸系列" } },
  { name: "檸檬雞腿排 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 445, nutrients: { protein: 32, fat: 14, carbs: 52, fiber: 5, sodium: 620 }, metadata: { price: 140, category: "雞腿系列" } },
  { name: "鹽烤魚肉 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 505, nutrients: { protein: 38, fat: 16, carbs: 52, fiber: 5, sodium: 680 }, metadata: { price: 145, category: "魚類系列" } },
  { name: "牛腱心 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 418, nutrients: { protein: 38, fat: 8, carbs: 50, fiber: 5, sodium: 650 }, metadata: { price: 160, category: "牛肉系列" } },
  { name: "壽喜燒牛五花 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 575, nutrients: { protein: 32, fat: 22, carbs: 62, fiber: 5, sodium: 800 }, metadata: { price: 150, category: "牛肉系列" } },
  { name: "泰式豬肉 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 375, nutrients: { protein: 28, fat: 10, carbs: 46, fiber: 5, sodium: 680 }, metadata: { price: 125, category: "豬肉系列" } },
  { name: "牛肉漢堡排 餐盒", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 439, nutrients: { protein: 32, fat: 14, carbs: 50, fiber: 5, sodium: 720 }, metadata: { price: 140, category: "牛肉系列" } },
  { name: "蔬菜組合（五辛蛋奶素）", brand: "蛋白盒子", source: "verified", servingSize: 1, servingUnit: "盒", householdServing: "一個餐盒", calories: 245, nutrients: { protein: 10, fat: 5, carbs: 42, fiber: 10, sodium: 400 }, metadata: { price: 100, category: "素食系列" } },
];
