"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, X, Share } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in window.navigator &&
      (window.navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // Check it's Safari (not Chrome/Firefox on iOS — they all use WebKit but only Safari supports Add to Home Screen properly)
  const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
  return isIOS && isSafari;
}

function wasDismissedRecently(): boolean {
  if (typeof localStorage === "undefined") return false;
  const dismissed = localStorage.getItem(DISMISSED_KEY);
  if (!dismissed) return false;
  const ts = parseInt(dismissed, 10);
  return Date.now() - ts < DISMISS_DURATION_MS;
}

export function PwaInstallBanner() {
  const { t } = useTranslation("common");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden

  useEffect(() => {
    // Already installed as PWA or recently dismissed
    if (isStandalone() || wasDismissedRecently()) return;

    // Android/Chrome: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: show manual guide
    if (isIOSSafari()) {
      setShowIOSGuide(true);
      setDismissed(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  }, []);

  if (dismissed || (!deferredPrompt && !showIOSGuide)) return null;

  // iOS Safari — show "Add to Home Screen" guide
  if (showIOSGuide) {
    return (
      <div className="mx-4 mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Share className="h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={1.5} />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              {t("pwa.iosTitle")}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-0.5 text-green-500 hover:bg-green-100 dark:hover:bg-green-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-green-600 dark:text-green-400/80">
          <li>
            {t("pwa.iosStep1")}{" "}
            <Share className="inline h-3.5 w-3.5" strokeWidth={1.5} />
          </li>
          <li>{t("pwa.iosStep2")}</li>
        </ol>
      </div>
    );
  }

  // Android/Chrome — one-click install
  return (
    <div className="mx-4 mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Download className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" strokeWidth={1.5} />
          <p className="truncate text-sm font-medium text-green-700 dark:text-green-300">
            {t("pwa.installTitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleInstall}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            {t("pwa.installButton")}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-full p-0.5 text-green-500 hover:bg-green-100 dark:hover:bg-green-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
