"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Square, X, Volume2, VolumeX } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import {
  completeActivitySession,
  discardActivitySession,
} from "@/server/actions/activity";
import {
  useActivityTimerStore,
  useActivityTimerTick,
  formatDuration,
} from "@/hooks/use-activity-timer";
import { useMeditationAudio } from "@/hooks/use-meditation-audio";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "react-i18next";
import {
  MEDITATION_TYPE_LABELS,
  FEELING_TAGS,
  FEELING_TAG_LABELS,
  MOOD_LEVELS,
} from "@open-health/shared/constants";
import type { MeditationMetadata, FeelingTag } from "@open-health/shared/types";

export default function ActiveMeditationPage() {
  const router = useRouter();
  const { t } = useTranslation(["meditation", "common"]);
  const { isAuthenticated } = useAuthGuard();

  const { data: activeSession, isLoading, isFetching } =
    trpc.activity.getActive.useQuery(
      { type: "meditation" },
      { enabled: isAuthenticated, staleTime: 0 }
    );

  const utils = trpc.useUtils();
  const {
    elapsedSeconds,
    isRunning,
    startSession,
    stopSession,
  } = useActivityTimerStore();
  useActivityTimerTick();

  const {
    musicPlaying,
    bellRinging,
    warmupBell,
    startMusic,
    stopMusic,
    toggleMusic,
    startBell,
    stopBell,
    cleanup: cleanupAudio,
  } = useMeditationAudio();

  const bellTriggeredRef = useRef(false);

  // Completion form state
  const [showComplete, setShowComplete] = useState(false);
  const [moodBefore, setMoodBefore] = useState<number>(3);
  const [moodAfter, setMoodAfter] = useState<number>(3);
  const [feelingsBefore, setFeelingsBefore] = useState<FeelingTag[]>([]);
  const [feelingsAfter, setFeelingsAfter] = useState<FeelingTag[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const meta = activeSession?.metadata as unknown as MeditationMetadata | null;
  const plannedDuration = meta?.plannedDurationSec;
  const musicEnabled = meta?.musicEnabled;

  // Start the timer + music when session data loads
  useEffect(() => {
    if (activeSession && !isRunning) {
      startSession(
        activeSession.id,
        "meditation",
        new Date(activeSession.startedAt)
      );
    }
  }, [activeSession, isRunning, startSession]);

  // Start music on mount if enabled; always warm up the bell for Safari PWA
  useEffect(() => {
    if (activeSession) {
      if (musicEnabled && !musicPlaying && !bellRinging) {
        startMusic(0.4); // startMusic also warms up the bell
      } else {
        warmupBell(); // warm up bell even when music is off
      }
    }
    return () => {
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id]);

  // Check if timer reached planned duration → trigger bell
  useEffect(() => {
    if (
      plannedDuration &&
      elapsedSeconds >= plannedDuration &&
      !bellTriggeredRef.current &&
      isRunning
    ) {
      bellTriggeredRef.current = true;
      startBell();
    }
  }, [elapsedSeconds, plannedDuration, isRunning, startBell]);

  const handleComplete = useCallback(() => {
    stopBell();
    stopMusic();
    setShowComplete(true);
  }, [stopBell, stopMusic]);

  const handleDismissAlarm = useCallback(() => {
    stopBell();
  }, [stopBell]);

  const handleSave = async () => {
    if (!activeSession) return;
    setSaving(true);
    try {
      const metadata: Partial<MeditationMetadata> = {
        completed: true,
        moodBefore,
        moodAfter,
        feelingsBefore,
        feelingsAfter,
      };
      await completeActivitySession({
        sessionId: activeSession.id,
        note: note || undefined,
        metadata: metadata as Record<string, unknown>,
      });
      stopSession();
      cleanupAudio();
      await utils.activity.invalidate();
      toast.success(t("meditation:sessionComplete"));
      router.push("/hub/meditation");
      router.refresh();
    } catch {
      toast.error(t("common:toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!activeSession) return;
    const confirmed = window.confirm(t("meditation:discardConfirm"));
    if (!confirmed) return;
    setDiscarding(true);
    try {
      await discardActivitySession({ sessionId: activeSession.id });
      stopSession();
      cleanupAudio();
      await utils.activity.invalidate();
      router.push("/hub/meditation");
      router.refresh();
    } catch {
      toast.error(t("common:toast.error"));
    } finally {
      setDiscarding(false);
    }
  };

  const toggleFeeling = (
    tag: FeelingTag,
    list: FeelingTag[],
    setter: (v: FeelingTag[]) => void
  ) => {
    if (list.includes(tag)) {
      setter(list.filter((f) => f !== tag));
    } else {
      setter([...list, tag]);
    }
  };

  // Only redirect after a fresh fetch confirms no active session
  const querySettled = isAuthenticated && !isLoading && !isFetching;

  useEffect(() => {
    if (querySettled && !activeSession) {
      router.push("/hub/meditation");
    }
  }, [querySettled, activeSession, router]);

  if (!activeSession) return <LoadingSpinner />;

  // Alarm ringing overlay
  if (bellRinging) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-6">
        <p className="text-6xl mb-6">🔔</p>
        <h1 className="text-xl font-light mb-2">{t("meditation:alarmTitle")}</h1>
        <p className="text-sm text-neutral-400 mb-8 text-center">
          {plannedDuration ? formatDuration(plannedDuration) : ""} {t("meditation:alarmCompleted")}
        </p>

        <button
          onClick={() => {
            handleDismissAlarm();
            handleComplete();
          }}
          className="w-full max-w-xs py-4 rounded-lg bg-primary text-white text-base font-medium transition-colors hover:bg-primary/90 mb-3"
        >
          {t("meditation:endAndRecord")}
        </button>

        <button
          onClick={handleDismissAlarm}
          className="w-full max-w-xs py-3 rounded-lg border border-black/10 dark:border-white/10 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
        >
          {t("meditation:dismissAlarmContinue")}
        </button>
      </div>
    );
  }

  // Completion form
  if (showComplete) {
    return (
      <div className="px-4 py-6 space-y-6">
        <h1 className="text-xl font-light tracking-wide">
          {t("meditation:sessionComplete")}
        </h1>

        {/* Duration summary */}
        <div className="text-center py-4">
          <p className="text-4xl font-extralight tabular-nums text-primary">
            {formatDuration(elapsedSeconds)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {(meta?.meditationType && MEDITATION_TYPE_LABELS[meta.meditationType]) || t("meditation:title")}
          </p>
        </div>

        {/* Mood before */}
        <div className="space-y-2">
          <p className="text-sm font-light">{t("meditation:moodBefore")}</p>
          <div className="flex gap-2 justify-center">
            {MOOD_LEVELS.map((level) => (
              <button
                key={`before-${level}`}
                onClick={() => setMoodBefore(level)}
                className={`w-12 h-12 rounded-full text-xl transition-all ${
                  moodBefore === level
                    ? "bg-primary/10 ring-2 ring-primary scale-110"
                    : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {t(`meditation:moodEmojis.${level}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Feelings before */}
        <div className="space-y-2">
          <p className="text-sm font-light">{t("meditation:feelingsBefore")}</p>
          <div className="flex flex-wrap gap-1.5">
            {FEELING_TAGS.map((tag) => (
              <button
                key={`before-${tag}`}
                onClick={() =>
                  toggleFeeling(tag, feelingsBefore, setFeelingsBefore)
                }
                className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                  feelingsBefore.includes(tag)
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                }`}
              >
                {FEELING_TAG_LABELS[tag]}
              </button>
            ))}
          </div>
        </div>

        {/* Mood after */}
        <div className="space-y-2">
          <p className="text-sm font-light">{t("meditation:moodAfter")}</p>
          <div className="flex gap-2 justify-center">
            {MOOD_LEVELS.map((level) => (
              <button
                key={`after-${level}`}
                onClick={() => setMoodAfter(level)}
                className={`w-12 h-12 rounded-full text-xl transition-all ${
                  moodAfter === level
                    ? "bg-primary/10 ring-2 ring-primary scale-110"
                    : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {t(`meditation:moodEmojis.${level}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Feelings after */}
        <div className="space-y-2">
          <p className="text-sm font-light">{t("meditation:feelingsAfter")}</p>
          <div className="flex flex-wrap gap-1.5">
            {FEELING_TAGS.map((tag) => (
              <button
                key={`after-${tag}`}
                onClick={() =>
                  toggleFeeling(tag, feelingsAfter, setFeelingsAfter)
                }
                className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                  feelingsAfter.includes(tag)
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                }`}
              >
                {FEELING_TAG_LABELS[tag]}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <p className="text-sm font-light">{t("meditation:note")}</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("meditation:notePlaceholder")}
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2 text-sm font-light placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            rows={3}
          />
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowComplete(false)}
            className="flex-1 py-3 rounded-lg border border-black/10 dark:border-white/10 text-sm font-light"
          >
            {t("meditation:cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? t("meditation:saving") : t("meditation:save")}
          </button>
        </div>
      </div>
    );
  }

  // Remaining time for countdown
  const remainingSeconds = plannedDuration
    ? Math.max(0, plannedDuration - elapsedSeconds)
    : null;
  const progress = plannedDuration
    ? Math.min(1, elapsedSeconds / plannedDuration)
    : null;

  // Active timer view
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-6">
      {/* Meditation type */}
      <p className="text-sm font-light text-neutral-400 mb-2">
        {(meta?.meditationType && MEDITATION_TYPE_LABELS[meta.meditationType]) || t("meditation:title")}
      </p>

      {/* Timer circle */}
      <div className="relative flex items-center justify-center w-64 h-64 rounded-full border-2 border-primary/20 mb-4">
        <div className="text-center">
          {plannedDuration ? (
            <>
              <p className="text-5xl font-extralight tabular-nums tracking-wider">
                {formatDuration(remainingSeconds!)}
              </p>
              <p className="text-xs text-neutral-400 mt-2">{t("meditation:remainingTime")}</p>
              <p className="text-[10px] text-neutral-300 dark:text-neutral-700 mt-1">
                {Math.round((progress ?? 0) * 100)}%
              </p>
            </>
          ) : (
            <>
              <p className="text-5xl font-extralight tabular-nums tracking-wider">
                {formatDuration(elapsedSeconds)}
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                {t("meditation:timer.elapsed")}
              </p>
            </>
          )}
        </div>

        {/* Animated pulse ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/10 animate-ping pointer-events-none"
          style={{ animationDuration: "4s" }}
        />
      </div>

      {/* Music toggle */}
      <button
        onClick={() => toggleMusic(0.4)}
        className="flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-black/[0.06] dark:border-white/[0.06] transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
      >
        {musicPlaying ? (
          <Volume2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
        ) : (
          <VolumeX className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
        )}
        <span
          className={`text-xs ${musicPlaying ? "text-primary" : "text-neutral-400"}`}
        >
          {musicPlaying ? t("meditation:musicPlaying") : t("meditation:musicOff")}
        </span>
      </button>

      {/* Controls */}
      <div className="flex items-center gap-6">
        {/* Discard */}
        <button
          onClick={handleDiscard}
          disabled={discarding}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 text-destructive/70 hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Complete */}
        <button
          onClick={handleComplete}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Square className="h-6 w-6" strokeWidth={2} fill="currentColor" />
        </button>

        {/* Placeholder for symmetry */}
        <div className="w-12" />
      </div>

      <p className="text-xs text-neutral-400 mt-4">
        {t("meditation:endSession")}
      </p>
    </div>
  );
}
