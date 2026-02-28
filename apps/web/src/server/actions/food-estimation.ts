"use server";

import { auth } from "@/server/auth";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

const SYSTEM_PROMPT = `你是一個台灣營養學專家。使用者會用文字描述他吃了什麼食物、大概的份量或重量，請根據你的知識估算該食物的營養成分。

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

export async function estimateNutritionFromText(description: string) {
  await getSession();

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return { success: false as const, error: "未設定 MiniMax API Key" };
  }

  if (!description.trim()) {
    return { success: false as const, error: "請輸入食物描述" };
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
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: description,
            },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MiniMax API error:", response.status, errorText);
      return {
        success: false as const,
        error: `API 請求失敗 (${response.status})`,
      };
    }

    const result = await response.json();

    // Check for API-level errors
    if (result.base_resp?.status_code !== 0) {
      console.error("MiniMax API error:", result.base_resp);
      return {
        success: false as const,
        error: `AI 服務錯誤: ${result.base_resp?.status_msg || "未知錯誤"}`,
      };
    }

    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false as const, error: "AI 未回傳結果" };
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const data = JSON.parse(jsonStr);

    // Validate required fields
    if (!data.foodName || data.calories == null) {
      return { success: false as const, error: "AI 回傳格式不完整" };
    }

    return { success: true as const, data };
  } catch (error) {
    console.error("Food estimation error:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "估算失敗，請重試",
    };
  }
}
