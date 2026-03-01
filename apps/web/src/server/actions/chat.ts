"use server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { chatSessions } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function createChatSession({ title }: { title: string }) {
  const user = await getSession();

  const [session] = await db
    .insert(chatSessions)
    .values({
      userId: user.id,
      title: title.slice(0, 50) || "新對話",
    })
    .returning({ id: chatSessions.id });

  return { id: session.id };
}

export async function deleteChatSession(sessionId: string) {
  const user = await getSession();

  await db
    .delete(chatSessions)
    .where(
      and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, user.id))
    );

  revalidatePath("/chat");
  return { success: true };
}
