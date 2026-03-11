"use server";

import { getSession } from "@/server/lib/get-session";
import { db } from "@/server/db";
import { users, foods } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function deleteAccount() {
  const user = await getSession();

  // Nullify foods.createdBy (no cascade on this FK)
  await db
    .update(foods)
    .set({ createdBy: null })
    .where(eq(foods.createdBy, user.id));

  // Delete user row — cascades to all related tables (sessions, accounts, etc.)
  await db.delete(users).where(eq(users.id, user.id));

  return { success: true };
}
