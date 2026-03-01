"use server";

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { recognizeNutritionLabel as recognizeLabel } from "@/server/services/ai";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function recognizeNutritionLabel(base64Image: string) {
  await getSession();
  return recognizeLabel(base64Image);
}
