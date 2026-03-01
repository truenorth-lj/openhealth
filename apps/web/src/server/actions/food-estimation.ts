"use server";

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { estimateNutritionFromText as estimateNutrition } from "@/server/services/ai";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function estimateNutritionFromText(description: string) {
  await getSession();
  return estimateNutrition(description);
}
