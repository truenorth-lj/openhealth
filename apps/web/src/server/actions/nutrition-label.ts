"use server";

import { GoogleGenerativeAI, type Schema, SchemaType } from "@google/generative-ai";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    foodName: { type: SchemaType.STRING, description: "食品名稱" },
    brand: { type: SchemaType.STRING, description: "品牌名稱", nullable: true },
    servingSize: { type: SchemaType.NUMBER, description: "每份份量數值" },
    servingUnit: { type: SchemaType.STRING, description: "份量單位 (g/ml/個)" },
    calories: { type: SchemaType.NUMBER, description: "熱量 kcal" },
    proteinG: { type: SchemaType.NUMBER, description: "蛋白質 g" },
    fatG: { type: SchemaType.NUMBER, description: "脂肪 g" },
    carbsG: { type: SchemaType.NUMBER, description: "碳水化合物 g" },
    sodiumMg: { type: SchemaType.NUMBER, description: "鈉 mg", nullable: true },
    sugarG: { type: SchemaType.NUMBER, description: "糖 g", nullable: true },
    fiberG: { type: SchemaType.NUMBER, description: "膳食纖維 g", nullable: true },
    saturatedFatG: { type: SchemaType.NUMBER, description: "飽和脂肪 g", nullable: true },
    transFatG: { type: SchemaType.NUMBER, description: "反式脂肪 g", nullable: true },
    cholesterolMg: { type: SchemaType.NUMBER, description: "膽固醇 mg", nullable: true },
  },
  required: ["foodName", "servingSize", "servingUnit", "calories", "proteinG", "fatG", "carbsG"],
};

const SYSTEM_PROMPT = `你是一個台灣食品營養標籤辨識專家。請分析圖片中的營養標示，提取以下資訊：

規則：
1. 優先讀取「每份」的營養數值。如果只有「每100g/ml」的數值，則以 100 為 servingSize。
2. 食品名稱請從包裝上辨識，如果看不到名稱就填「未知食品」。
3. 品牌請從包裝上辨識，找不到可以為 null。
4. servingUnit 通常是 "g" 或 "ml"。
5. 所有數值請轉換為正確的單位：熱量為 kcal、蛋白質/脂肪/碳水為 g、鈉為 mg。
6. 如果標示上寫的是 kJ（千焦），請轉換為 kcal（除以 4.184）。
7. 找不到的可選欄位請設為 null。
8. 台灣營養標示常見格式：每份、每100公克、每日參考值百分比。請優先使用「每份」數值。`;

export async function recognizeNutritionLabel(base64Image: string) {
  await getSession();

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return { success: false as const, error: "未設定 Google AI API Key" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
    ]);

    const text = result.response.text();
    const data = JSON.parse(text);

    return { success: true as const, data };
  } catch (error) {
    console.error("Nutrition label recognition error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "辨識失敗，請重試",
    };
  }
}
