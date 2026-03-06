"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { PostHogPageView } from "@/components/posthog-pageview";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    posthog.init(POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false, // we handle this manually for SPA navigation
      capture_pageleave: true,
    });
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      <PostHogAuthWrapper>{children}</PostHogAuthWrapper>
    </PHProvider>
  );
}

function PostHogAuthWrapper({ children }: { children: React.ReactNode }) {
  const ph = usePostHog();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      ph.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    } else {
      ph.reset();
    }
  }, [ph, session?.user]);

  return <>{children}</>;
}
