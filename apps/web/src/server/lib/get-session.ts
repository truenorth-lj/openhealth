import { auth } from "@/server/auth";
import { headers } from "next/headers";

/**
 * Get authenticated user session for server actions.
 * Throws if not authenticated.
 */
export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}
