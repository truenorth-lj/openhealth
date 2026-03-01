import { GoogleGenerativeAI, type Schema, SchemaType } from "@google/generative-ai";

const nutritionLabelSchema: Schema = {
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

const LABEL_SYSTEM_PROMPT = `你是一個台灣食品營養標籤辨識專家。請分析圖片中的營養標示，提取以下資訊：

規則：
1. 優先讀取「每份」的營養數值。如果只有「每100g/ml」的數值，則以 100 為 servingSize。
2. 食品名稱請從包裝上辨識，如果看不到名稱就填「未知食品」。
3. 品牌請從包裝上辨識，找不到可以為 null。
4. servingUnit 通常是 "g" 或 "ml"。
5. 所有數值請轉換為正確的單位：熱量為 kcal、蛋白質/脂肪/碳水為 g、鈉為 mg。
6. 如果標示上寫的是 kJ（千焦），請轉換為 kcal（除以 4.184）。
7. 找不到的可選欄位請設為 null。
8. 台灣營養標示常見格式：每份、每100公克、每日參考值百分比。請優先使用「每份」數值。`;

const ESTIMATION_SYSTEM_PROMPT = `你是一個台灣營養學專家。使用者會用文字描述他吃了什麼食物、大概的份量或重量，請根據你的知識估算該食物的營養成分。

規則：
1. 根據食物描述推算合理的份量（如果使用者有提供重量就用使用者提供的）。
2. servingSize 為該份食物的總重量（g）或容量（ml），servingUnit 通常是 "g" 或 "ml"。
3. 所有營養數值都是針對使用者描述的這一份食物的總量。
4. 熱量為 kcal、蛋白質/脂肪/碳水為 g、鈉為 mg、膽固醇為 mg。
5. 盡量估算所有欄位，如果真的無法推測的可選欄位可以設為 null。
6. 食品名稱請用繁體中文，簡潔描述（例如：「涼麵」「雞腿便當」）。
7. 如果使用者描述不清楚，用台灣常見的份量來估算。

請回傳嚴格的 JSON 格式（不要有多餘文字），欄位如下：
{
  "foodName": "食品名稱（繁體中文）",
  "brand": null,
  "servingSize": 數字（克或毫升）,
  "servingUnit": "g" 或 "ml",
  "calories": 數字（kcal）,
  "proteinG": 數字（g）,
  "fatG": 數字（g）,
  "carbsG": 數字（g）,
  "sodiumMg": 數字或null（mg）,
  "sugarG": 數字或null（g）,
  "fiberG": 數字或null（g）,
  "saturatedFatG": 數字或null（g）,
  "transFatG": 數字或null（g）,
  "cholesterolMg": 數字或null（mg）
}

只回傳 JSON，不要有任何其他文字。`;

export type NutritionLabelResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string };

export type NutritionEstimationResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string };

export async function recognizeNutritionLabel(
  base64Image: string
): Promise<NutritionLabelResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "未設定 Google AI API Key" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: nutritionLabelSchema,
      },
    });

    const result = await model.generateContent([
      { text: LABEL_SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
    ]);

    const text = result.response.text();
    const data = JSON.parse(text);

    return { success: true, data };
  } catch (error) {
    console.error("Nutrition label recognition error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "辨識失敗，請重試",
    };
  }
}

export async function estimateNutritionFromText(
  description: string
): Promise<NutritionEstimationResult> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return { success: false, error: "未設定 MiniMax API Key" };
  }

  if (!description.trim()) {
    return { success: false, error: "請輸入食物描述" };
  }

  try {
    const response = await fetch(
      "https://api.minimax.io/v1/text/chatcompletion_v2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "MiniMax-M2.5",
          messages: [
            { role: "system", content: ESTIMATION_SYSTEM_PROMPT },
            { role: "user", content: description },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MiniMax API error:", response.status, errorText);
      return { success: false, error: `API 請求失敗 (${response.status})` };
    }

    const result = await response.json();

    if (result.base_resp?.status_code !== 0) {
      console.error("MiniMax API error:", result.base_resp);
      return {
        success: false,
        error: `AI 服務錯誤: ${result.base_resp?.status_msg || "未知錯誤"}`,
      };
    }

    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, error: "AI 未回傳結果" };
    }

    let jsonStr = content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const data = JSON.parse(jsonStr);

    if (!data.foodName || data.calories == null) {
      return { success: false, error: "AI 回傳格式不完整" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Food estimation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "估算失敗，請重試",
    };
  }
}
