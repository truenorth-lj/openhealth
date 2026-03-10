"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { ArrowLeft, Droplets, BellRing } from "lucide-react";
import Link from "next/link";
import { requestNotificationPermission } from "@/hooks/use-water-reminder";
import { NotificationPermissionGuard } from "@/components/notification-permission-guard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "react-i18next";

const INTERVAL_VALUES = [30, 60, 90, 120, 180, 240, 360];

export default function NotificationSettingsPage() {
  const { data: settings, isLoading } =
    trpc.notification.getWaterReminderSettings.useQuery();

  const updateSettings =
    trpc.notification.updateWaterReminderSettings.useMutation({
      onSuccess: () => {
        toast.success(t("settings:notificationsPage.settingsSaved"));
        utils.notification.getWaterReminderSettings.invalidate();
      },
      onError: (err) => toast.error(err.message),
    });

  const utils = trpc.useUtils();

  const { t } = useTranslation(["settings", "common"]);
  const [enabled, setEnabled] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("22:00");
  const [intervalMinutes, setIntervalMinutes] = useState(120);
  const [stopWhenGoalReached, setStopWhenGoalReached] = useState(true);
  const [permissionState, setPermissionState] = useState<string>("default");

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setStartTime(settings.startTime);
      setEndTime(settings.endTime);
      setIntervalMinutes(settings.intervalMinutes);
      setStopWhenGoalReached(settings.stopWhenGoalReached);
    }
  }, [settings]);

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const handleToggleEnabled = async (nextEnabled: boolean) => {
    if (nextEnabled && permissionState !== "granted") {
      const permission = await requestNotificationPermission();
      setPermissionState(permission);
      if (permission !== "granted") {
        toast.error(t("settings:notificationsPage.enableNotification"));
        return;
      }
    }
    setEnabled(nextEnabled);
  };

  const handleSave = () => {
    updateSettings.mutate({
      enabled,
      startTime,
      endTime,
      intervalMinutes,
      stopWhenGoalReached,
    });
  };

  const hasChanges =
    settings &&
    (enabled !== settings.enabled ||
      startTime !== settings.startTime ||
      endTime !== settings.endTime ||
      intervalMinutes !== settings.intervalMinutes ||
      stopWhenGoalReached !== settings.stopWhenGoalReached);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="text-neutral-400 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-light tracking-wide">{t("settings:notifications")}</h1>
      </div>

      {/* Notification permission guard — auto-detects & guides user */}
      <NotificationPermissionGuard />

      {/* Water Reminder Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Droplets
            className="h-4 w-4 text-blue-500"
            strokeWidth={1.5}
          />
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            {t("notificationsPage.waterReminder")}
          </p>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <BellRing
              className="h-4 w-4 text-neutral-400 dark:text-neutral-600"
              strokeWidth={1.5}
            />
            <span className="text-sm font-light">{t("settings:notificationsPage.enableWaterReminder")}</span>
          </div>
          <button
            onClick={() => handleToggleEnabled(!enabled)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
              enabled
                ? "bg-blue-500"
                : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Settings (shown when enabled) */}
        {enabled && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Time range */}
            <div className="space-y-3">
              <p className="text-xs font-light text-neutral-400">
                {t("notificationsPage.reminderPeriod")}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-600">
                    {t("notificationsPage.startTime")}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <span className="mt-5 text-neutral-300 dark:text-neutral-700">
                  —
                </span>
                <div className="flex-1">
                  <label className="text-[10px] text-neutral-400 dark:text-neutral-600">
                    {t("notificationsPage.endTime")}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Interval */}
            <div className="space-y-3">
              <p className="text-xs font-light text-neutral-400">
                {t("notificationsPage.reminderInterval")}
              </p>
              <div className="flex flex-wrap gap-2">
                {INTERVAL_VALUES.map((val) => (
                  <button
                    key={val}
                    onClick={() => setIntervalMinutes(val)}
                    className={`rounded-lg border px-3 py-2 text-sm font-light transition-all duration-300 ${
                      intervalMinutes === val
                        ? "border-blue-500 text-blue-500"
                        : "border-black/[0.06] dark:border-white/[0.06] text-neutral-400 dark:text-neutral-600 hover:text-foreground hover:border-foreground/10"
                    }`}
                  >
                    {t(`notificationsPage.interval${val}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Stop when goal reached */}
            <div className="flex items-center justify-between py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <span className="text-sm font-light">{t("settings:notificationsPage.stopAfterGoal")}</span>
                <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">
                  {t("notificationsPage.stopAfterGoalDesc")}
                </p>
              </div>
              <button
                onClick={() =>
                  setStopWhenGoalReached(!stopWhenGoalReached)
                }
                className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                  stopWhenGoalReached
                    ? "bg-blue-500"
                    : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                    stopWhenGoalReached
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Info text */}
            <p className="text-xs text-neutral-400 dark:text-neutral-600">
              {t("notificationsPage.reminderNote")}
            </p>
          </div>
        )}
      </div>

      {/* Save button */}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {updateSettings.isPending ? t("notificationsPage.saving") : t("notificationsPage.saveSettings")}
        </button>
      )}
    </div>
  );
}
