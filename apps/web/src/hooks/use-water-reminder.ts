"use client";

import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc-client";
import { todayString } from "@open-health/shared/utils";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isInTimeRange(startTime: string, endTime: string): boolean {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return nowMinutes >= start && nowMinutes <= end;
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return Promise.resolve("denied" as NotificationPermission);
  }
  if (Notification.permission === "granted") {
    return Promise.resolve("granted");
  }
  if (Notification.permission === "denied") {
    return Promise.resolve("denied");
  }
  return Notification.requestPermission();
}

function sendNotification(totalMl: number, goalMl: number) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const remaining = goalMl - totalMl;
  const body =
    remaining <= 0
      ? `今日已喝 ${totalMl} mL，已達到目標！`
      : `今日已喝 ${totalMl} / ${goalMl} mL，還需 ${remaining} mL`;

  // Prefer SW-based notification (works when tab is backgrounded / PWA minimized)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.showNotification("該喝水了！", {
          body,
          icon: "/icon.svg",
          tag: "water-reminder",
          data: { url: "/water" },
        });
      })
      .catch(() => {
        new Notification("該喝水了！", {
          body,
          icon: "/icon.svg",
          tag: "water-reminder",
        });
      });
  } else {
    new Notification("該喝水了！", {
      body,
      icon: "/icon.svg",
      tag: "water-reminder",
    });
  }
}

export function useWaterReminder() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: settings } = trpc.notification.getWaterReminderSettings.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: todayData } = trpc.water.getToday.useQuery(
    { date: todayString() },
    { staleTime: 60 * 1000 }
  );

  const checkAndNotify = useCallback(() => {
    if (!settings?.enabled) return;
    if (!isInTimeRange(settings.startTime, settings.endTime)) return;

    const totalMl = todayData?.totalMl ?? 0;
    const goalMl = todayData?.goalMl ?? 2500;

    if (settings.stopWhenGoalReached && totalMl >= goalMl) return;

    sendNotification(totalMl, goalMl);
  }, [settings, todayData]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!settings?.enabled) return;

    const intervalMs = settings.intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(checkAndNotify, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings?.enabled, settings?.intervalMinutes, checkAndNotify]);
}
