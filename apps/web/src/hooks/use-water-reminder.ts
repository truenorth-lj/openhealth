"use client";

import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc-client";
import { todayString } from "@open-health/shared/utils";
import {
  evaluateMilestones,
  timeToMinutes,
  type MilestoneCheckpoint,
} from "@open-health/shared/water-milestone";

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

function sendNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.showNotification(title, {
          body,
          icon: "/icon.svg",
          tag: "water-reminder",
          data: { url: "/hub/water" },
        });
      })
      .catch(() => {
        new Notification(title, { body, icon: "/icon.svg", tag: "water-reminder" });
      });
  } else {
    new Notification(title, { body, icon: "/icon.svg", tag: "water-reminder" });
  }
}

function sendIntervalNotification(totalMl: number, goalMl: number) {
  const remaining = goalMl - totalMl;
  const body =
    remaining <= 0
      ? `今日已喝 ${totalMl} mL，已達到目標！`
      : `今日已喝 ${totalMl} / ${goalMl} mL，還需 ${remaining} mL`;

  sendNotification("該喝水了！", body);
}

function sendMilestoneNotification(
  checkpoint: MilestoneCheckpoint,
  currentMl: number,
  deficitMl: number,
) {
  const body = `${checkpoint.time} 目標 ${checkpoint.targetMl} mL，目前 ${currentMl} mL，還差 ${deficitMl} mL`;
  sendNotification("還沒喝到目標！", body);
}

export function useWaterReminder() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedCheckpointsRef = useRef<Set<string>>(new Set());
  const lastDateRef = useRef<string>(todayString());

  const { data: settings } = trpc.notification.getWaterReminderSettings.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: todayData } = trpc.water.getToday.useQuery(
    { date: todayString() },
    { staleTime: 60 * 1000 }
  );
  const { data: checkpoints } = trpc.notification.getMilestoneCheckpoints.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000,
      enabled: settings?.reminderMode === "milestone",
    }
  );

  // Reset notified set on date change
  useEffect(() => {
    const today = todayString();
    if (today !== lastDateRef.current) {
      notifiedCheckpointsRef.current.clear();
      lastDateRef.current = today;
    }
  });

  const checkAndNotifyInterval = useCallback(() => {
    if (!settings?.enabled || settings.reminderMode !== "interval") return;
    if (!isInTimeRange(settings.startTime, settings.endTime)) return;

    const totalMl = todayData?.totalMl ?? 0;
    const goalMl = todayData?.goalMl ?? 2500;

    if (settings.stopWhenGoalReached && totalMl >= goalMl) return;

    sendIntervalNotification(totalMl, goalMl);
  }, [settings, todayData]);

  const checkAndNotifyMilestone = useCallback(() => {
    if (!settings?.enabled || settings.reminderMode !== "milestone") return;
    if (!checkpoints || checkpoints.length === 0) return;

    const totalMl = todayData?.totalMl ?? 0;
    const goalMl = todayData?.goalMl ?? 2500;
    const now = new Date();
    const currentTimeMins = now.getHours() * 60 + now.getMinutes();

    const evaluation = evaluateMilestones(
      checkpoints,
      currentTimeMins,
      totalMl,
      settings.stopWhenGoalReached,
      goalMl,
    );

    if (
      evaluation.shouldRemind &&
      evaluation.checkpoint &&
      !notifiedCheckpointsRef.current.has(evaluation.checkpoint.time)
    ) {
      notifiedCheckpointsRef.current.add(evaluation.checkpoint.time);
      sendMilestoneNotification(
        evaluation.checkpoint,
        evaluation.currentIntakeMl,
        evaluation.deficitMl,
      );
    }
  }, [settings, todayData, checkpoints]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!settings?.enabled) return;

    if (settings.reminderMode === "milestone") {
      // Check every minute for milestone mode
      intervalRef.current = setInterval(checkAndNotifyMilestone, 60 * 1000);
    } else {
      const intervalMs = settings.intervalMinutes * 60 * 1000;
      intervalRef.current = setInterval(checkAndNotifyInterval, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    settings?.enabled,
    settings?.reminderMode,
    settings?.intervalMinutes,
    checkAndNotifyInterval,
    checkAndNotifyMilestone,
  ]);
}
