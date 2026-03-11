"use server";

import { getSession } from "@/server/lib/get-session";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users, foods } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function deleteAccount() {
  const user = await getSession();

  // Nullify foods.createdBy (no cascade on this FK)
  await db
    .update(foods)
    .set({ createdBy: null })
    .where(eq(foods.createdBy, user.id));

  // Revoke all sessions via Better Auth
  const reqHeaders = await headers();
  await auth.api.revokeOtherSessions({ headers: reqHeaders });

  // Delete user row — cascades to all related tables
  await db.delete(users).where(eq(users.id, user.id));

  return { success: true };
}
