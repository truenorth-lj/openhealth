"use server";

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { recognizeNutritionLabel as recognizeLabel } from "@/server/services/ai";
import {
  getSessionWithPlan,
  checkAndIncrementAiUsage,
} from "@/server/services/plan";

export async function recognizeNutritionLabel(base64Image: string) {
  const { user, plan } = await getSessionWithPlan(async () => {
    return auth.api.getSession({ headers: await headers() });
  });

  const usage = await checkAndIncrementAiUsage(user.id, "ocr", plan);
  if (!usage.allowed) {
    throw new Error("AI_LIMIT_REACHED");
  }

  return recognizeLabel(base64Image);
}
