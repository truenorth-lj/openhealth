import { db } from "@/server/db";
import { achievements, userAchievements } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function grantAchievement(userId: string, achievementName: string) {
  // Upsert the achievement definition
  const [achievement] = await db
    .insert(achievements)
    .values({
      name: achievementName,
      description:
        achievementName === "推薦達人"
          ? "成功推薦一位朋友加入"
          : "透過推薦碼加入",
      icon: achievementName === "推薦達人" ? "users" : "star",
      category: "referral",
      requirement: { type: "referral" },
    })
    .onConflictDoNothing()
    .returning();

  // If it already existed, fetch it
  let achievementId = achievement?.id;
  if (!achievementId) {
    const existing = await db
      .select({ id: achievements.id })
      .from(achievements)
      .where(eq(achievements.name, achievementName))
      .limit(1);
    achievementId = existing[0]?.id;
  }

  if (!achievementId) return;

  await db
    .insert(userAchievements)
    .values({ userId, achievementId })
    .onConflictDoNothing();
}
