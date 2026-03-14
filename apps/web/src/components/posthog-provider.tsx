"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Minimal context so posthog.capture() callers still work after lazy load
const PostHogReadyContext = createContext(false);
export function usePostHogReady() {
  return useContext(PostHogReadyContext);
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    // Defer PostHog initialization until after first paint
    const init = async () => {
      const posthog = (await import("posthog-js")).default;
      posthog.init(POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
      });
      setReady(true);
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(() => void init());
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(() => void init(), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <PostHogReadyContext.Provider value={ready}>
      {ready && POSTHOG_KEY ? <PostHogAuthSync /> : null}
      {children}
    </PostHogReadyContext.Provider>
  );
}

function PostHogAuthSync() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    import("posthog-js").then(({ default: posthog }) => {
      if (session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email,
          name: session.user.name,
        });
      } else {
        posthog.reset();
      }
    });
  }, [session?.user]);

  return null;
}
