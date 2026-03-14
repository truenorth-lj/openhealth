"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { usePostHogReady } from "@/components/posthog-provider";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ready = usePostHogReady();

  useEffect(() => {
    if (!pathname || !ready) return;
    import("posthog-js").then(({ default: posthog }) => {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", { $current_url: url });
    });
  }, [pathname, searchParams, ready]);

  return null;
}

export function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
