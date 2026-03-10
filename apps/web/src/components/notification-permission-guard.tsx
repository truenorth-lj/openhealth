"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, ExternalLink } from "lucide-react";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { useTranslation } from "react-i18next";

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in window.navigator &&
      (window.navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/**
 * Shows a banner when notification permission is not granted.
 * - "default": shows prompt with button for user to grant permission
 * - "denied": shows platform-specific instructions (iOS Settings vs browser settings)
 * - "granted": renders nothing
 */
export function NotificationPermissionGuard() {
  const { t } = useTranslation("posture");
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );
  const [requesting, setRequesting] = useState(false);
  const { subscribeToPush } = usePushSubscription();

  const checkPermission = useCallback(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const handleRequestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        await subscribeToPush();
      }
    } finally {
      setRequesting(false);
    }
  }, [subscribeToPush]);

  // Nothing to show if granted or not detectable
  if (!permission || permission === "granted") return null;

  const isIOS = isIOSDevice();
  const isPWA = isStandalone();

  // Permission is "default" — user needs to grant permission via button click
  if (permission === "default") {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {t("notification.needPermission")}
          </p>
        </div>
        <p className="text-sm text-amber-600 dark:text-amber-400/80">
          {t("notification.enableHint")}
        </p>
        <button
          onClick={handleRequestPermission}
          disabled={requesting}
          className="w-full rounded-lg bg-amber-500 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {requesting ? t("notification.requesting") : t("notification.allowNotification")}
        </button>
      </div>
    );
  }

  // Permission is "denied"
  return (
    <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-red-500" strokeWidth={1.5} />
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          {t("notification.permissionDenied")}
        </p>
      </div>

      {isIOS && isPWA ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400/80">
            {t("notification.iosStandalone")}
          </p>
          <ol className="text-sm text-red-600 dark:text-red-400/80 list-decimal list-inside space-y-1">
            <li>
              {t("notification.iosStep1Open")} <span className="font-medium">{t("notification.iosStep1Settings")}</span> {t("notification.iosStep1App")}
            </li>
            <li>
              {t("notification.iosStep2Find")}{" "}
              <span className="font-medium">{t("notification.iosStep2AppName")}</span>
            </li>
            <li>
              {t("notification.iosStep3Tap")} <span className="font-medium">{t("notification.iosStep3Notification")}</span>
            </li>
            <li>
              {t("notification.iosStep4Enable")} <span className="font-medium">{t("notification.iosStep4Allow")}</span>
            </li>
          </ol>
        </div>
      ) : isIOS ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400/80">
            {t("notification.iosSafari")}
          </p>
          <ol className="text-sm text-red-600 dark:text-red-400/80 list-decimal list-inside space-y-1">
            <li>
              {t("notification.iosSafariStep1Open")} <span className="font-medium">{t("notification.iosSafariStep1Settings")}</span> →{" "}
              <span className="font-medium">{t("notification.iosSafariStep1Safari")}</span>
            </li>
            <li>
              {t("notification.iosSafariStep2Find")} <span className="font-medium">{t("notification.iosSafariStep2Notification")}</span> {t("notification.iosSafariStep2Enable")}
            </li>
            <li>{t("notification.iosSafariStep3Refresh")}</li>
          </ol>
        </div>
      ) : (
        <p className="text-sm text-red-600 dark:text-red-400/80">
          {t("notification.browserBlocked")}
        </p>
      )}

      <button
        onClick={checkPermission}
        className="inline-flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-300 underline underline-offset-2"
      >
        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
        {t("notification.recheck")}
      </button>
    </div>
  );
}
