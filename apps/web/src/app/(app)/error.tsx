"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message.includes("Loading chunk") ||
    error.message.includes("Failed to fetch dynamically imported module")
  );
}

const RELOAD_KEY = "chunk-error-reload-count";
const MAX_RELOADS = 2;

/**
 * Clear all SW caches and unregister the service worker,
 * then reload with cache-busting to get fresh assets.
 */
async function clearCachesAndReload() {
  try {
    // Delete all SW caches
    const keys = await caches?.keys() ?? [];
    await Promise.all(keys.map((key) => caches?.delete(key)));

    // Unregister service workers so stale cache-first logic doesn't interfere
    const registrations = await navigator.serviceWorker?.getRegistrations();
    if (registrations) {
      await Promise.all(registrations.map((r) => r.unregister()));
    }
  } catch {
    // Cache API may not be available
  }

  // Navigate with cache-busting query param to bypass browser HTTP cache
  // Preserve existing query params and hash
  const separator = window.location.search ? "&" : "?";
  window.location.href =
    window.location.pathname +
    window.location.search +
    separator +
    "_cb=" +
    Date.now() +
    window.location.hash;
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation("common");
  useEffect(() => {
    // Auto-reload on chunk loading errors (typically caused by new deployments)
    if (isChunkLoadError(error)) {
      const reloadCount = Number(sessionStorage.getItem(RELOAD_KEY) || "0");

      if (reloadCount < MAX_RELOADS) {
        sessionStorage.setItem(RELOAD_KEY, String(reloadCount + 1));
        clearCachesAndReload();
        return;
      }

      // Exceeded max reloads — report to Sentry and show error UI
      sessionStorage.removeItem(RELOAD_KEY);
      try {
        Sentry.captureException(error, {
          tags: { chunkLoadError: true, reloadAttempts: MAX_RELOADS },
        });
      } catch {
        // Sentry may not be initialized
      }
      console.error("ChunkLoadError persisted after reload attempts:", error);
      return;
    }

    try {
      Sentry.captureException(error);
    } catch {
      // Sentry may not be initialized in all environments
    }
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <h2 className="text-lg font-semibold mb-2">{t("error.title")}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t("error.description")}</p>
      <Button onClick={() => reset()}>{t("buttons.retry")}</Button>
    </div>
  );
}
