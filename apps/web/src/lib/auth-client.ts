import { createAuthClient } from "better-auth/react";
import { useState, useEffect } from "react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "",
});

export const { signIn, signUp, signOut } = authClient;

const SESSION_CACHE_KEY = "oh-session-cache";

/**
 * Optimistic useSession: returns cached session from localStorage immediately
 * while Better Auth validates the session in the background.
 * This eliminates the "logged-out flash" when reopening the PWA.
 *
 * Uses isMounted guard to avoid hydration mismatch — cached data is only
 * returned after the client has mounted (SSR always sees isPending + null).
 */
export function useSession() {
  const session = authClient.useSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Persist session to localStorage whenever it changes
  if (isMounted) {
    if (session.data?.session) {
      try {
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session.data));
      } catch {
        // localStorage full or unavailable — ignore
      }
    } else if (session.data === null && !session.isPending) {
      // User logged out — clear cache
      localStorage.removeItem(SESSION_CACHE_KEY);
    }
  }

  // While loading, return cached session for instant UI (only after mount to avoid hydration mismatch)
  if (session.isPending && isMounted) {
    try {
      const cached = localStorage.getItem(SESSION_CACHE_KEY);
      if (cached) {
        return {
          ...session,
          data: JSON.parse(cached),
          isPending: true, // still mark as pending so caller knows it's validating
        };
      }
    } catch {
      // Corrupted cache — ignore
    }
  }

  return session;
}
