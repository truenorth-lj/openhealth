"use server";

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { estimateNutritionFromText as estimateNutrition } from "@/server/services/ai";
import {
  getSessionWithPlan,
  checkAndIncrementAiUsage,
} from "@/server/services/plan";

export async function estimateNutritionFromText(description: string) {
  const { user, plan } = await getSessionWithPlan(async () => {
    return auth.api.getSession({ headers: await headers() });
  });

  const usage = await checkAndIncrementAiUsage(user.id, "estimate", plan);
  if (!usage.allowed) {
    throw new Error("AI_LIMIT_REACHED");
  }

  return estimateNutrition(description);
}
