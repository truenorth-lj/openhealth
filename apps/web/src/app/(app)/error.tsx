"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message.includes("Loading chunk") ||
    error.message.includes("Failed to fetch dynamically imported module")
  );
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-reload on chunk loading errors (typically caused by new deployments)
    if (isChunkLoadError(error)) {
      window.location.reload();
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
      <h2 className="text-lg font-semibold mb-2">發生錯誤</h2>
      <p className="text-sm text-muted-foreground mb-4">很抱歉，頁面發生了問題</p>
      <Button onClick={() => reset()}>重試</Button>
    </div>
  );
}
