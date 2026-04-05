"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, SkipForward, Check } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import {
  completeActivitySession,
  discardActivitySession,
} from "@/server/actions/activity";
import { formatDuration } from "@/hooks/use-activity-timer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "react-i18next";
import {
  EYE_EXERCISES,
  EYE_EXERCISE_TARGET_LABELS,
  EYE_EXERCISE_REST_SEC,
} from "@open-health/shared/constants";
import type { EyeExerciseMetadata } from "@open-health/shared/types";

type Phase = "exercise" | "rest" | "complete";

export default function ActiveEyeExercisePage() {
  const router = useRouter();
  const { t } = useTranslation(["eye-exercise", "common"]);
  const { isAuthenticated } = useAuthGuard();

  const {
    data: activeSession,
    isLoading,
    isFetching,
  } = trpc.activity.getActive.useQuery(
    { type: "eye_exercise" },
    { enabled: isAuthenticated, staleTime: 0 }
  );

  const utils = trpc.useUtils();

  const meta =
    activeSession?.metadata as unknown as EyeExerciseMetadata | null;
  const exerciseIds = meta?.exerciseIds ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("exercise");
  const [countdown, setCountdown] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef<number>(Date.now());

  const currentExerciseId = exerciseIds[currentIndex];
  const currentExercise = EYE_EXERCISES.find(
    (e) => e.id === currentExerciseId
  );

  // Initialize countdown when exercise/phase changes
  useEffect(() => {
    if (phase === "exercise" && currentExercise) {
      setCountdown(currentExercise.durationSec);
    } else if (phase === "rest") {
      setCountdown(EYE_EXERCISE_REST_SEC);
    }
  }, [phase, currentIndex, currentExercise]);

  // Track total elapsed time
  useEffect(() => {
    if (activeSession) {
      startTimeRef.current = new Date(activeSession.startedAt).getTime();
    }
  }, [activeSession?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer tick
  useEffect(() => {
    if (phase === "complete") return;

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (phase === "exercise") {
            setCompletedCount((c) => c + 1);
            if (currentIndex < exerciseIds.length - 1) {
              setPhase("rest");
            } else {
              setPhase("complete");
            }
          } else if (phase === "rest") {
            setCurrentIndex((i) => i + 1);
            setPhase("exercise");
          }
          return 0;
        }
        return prev - 1;
      });
      setTotalElapsed(
        Math.floor((Date.now() - startTimeRef.current) / 1000)
      );
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, currentIndex, exerciseIds.length]);

  const handleSkip = useCallback(() => {
    setCompletedCount((c) => c + 1);
    if (currentIndex < exerciseIds.length - 1) {
      setPhase("rest");
    } else {
      setPhase("complete");
    }
  }, [currentIndex, exerciseIds.length]);

  const handleFinishEarly = useCallback(() => {
    setPhase("complete");
  }, []);

  const handleSave = async () => {
    if (!activeSession) return;
    setSaving(true);
    try {
      const metadata: Partial<EyeExerciseMetadata> = {
        completed: true,
        completedCount,
      };
      await completeActivitySession({
        sessionId: activeSession.id,
        note: note || undefined,
        metadata: metadata as Record<string, unknown>,
      });
      await utils.activity.invalidate();
      toast.success(t("eye-exercise:sessionComplete"));
      router.push("/hub/eye-exercise");
      router.refresh();
    } catch {
      toast.error(t("common:toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!activeSession) return;
    const confirmed = window.confirm(t("eye-exercise:discardConfirm"));
    if (!confirmed) return;
    setDiscarding(true);
    try {
      await discardActivitySession({ sessionId: activeSession.id });
      await utils.activity.invalidate();
      router.push("/hub/eye-exercise");
      router.refresh();
    } catch {
      toast.error(t("common:toast.error"));
    } finally {
      setDiscarding(false);
    }
  };

  // Redirect if no active session
  const querySettled = isAuthenticated && !isLoading && !isFetching;
  useEffect(() => {
    if (querySettled && !activeSession) {
      router.push("/hub/eye-exercise");
    }
  }, [querySettled, activeSession, router]);

  if (!activeSession || !currentExercise) return <LoadingSpinner />;

  const progressPct = ((currentIndex + (phase === "rest" ? 1 : 0)) / exerciseIds.length) * 100;

  // Completion screen
  if (phase === "complete") {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="text-center py-8">
          <p className="text-5xl mb-4">
            {completedCount === exerciseIds.length ? "🎉" : "👍"}
          </p>
          <h1 className="text-xl font-light tracking-wide">
            {t("eye-exercise:wellDone")}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {t("eye-exercise:sessionSummary")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 text-center">
            <p className="text-2xl font-light tabular-nums text-primary">
              {completedCount}/{exerciseIds.length}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {t("eye-exercise:exercisesCompleted")}
            </p>
          </div>
          <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 text-center">
            <p className="text-2xl font-light tabular-nums text-primary">
              {formatDuration(totalElapsed)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {t("eye-exercise:totalTime")}
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <p className="text-sm font-light">{t("eye-exercise:note")}</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("eye-exercise:notePlaceholder")}
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2 text-sm font-light placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            rows={3}
          />
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-3">
          <button
            onClick={handleDiscard}
            disabled={discarding}
            className="flex-1 py-3 rounded-lg border border-black/10 dark:border-white/10 text-sm font-light disabled:opacity-50"
          >
            {t("eye-exercise:cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {saving
              ? t("eye-exercise:saving")
              : t("eye-exercise:save")}
          </button>
        </div>
      </div>
    );
  }

  // Rest screen
  if (phase === "rest") {
    const nextExerciseId = exerciseIds[currentIndex + 1];
    const nextExercise = EYE_EXERCISES.find((e) => e.id === nextExerciseId);

    return (
      <div className="flex flex-col min-h-[70vh] px-4 py-6">
        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-neutral-400">
              {t("eye-exercise:exerciseProgress", {
                current: currentIndex + 1,
                total: exerciseIds.length,
              })}
            </p>
            <p className="text-xs text-neutral-400">{t("eye-exercise:rest")}</p>
          </div>
          <div className="h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-4xl mb-2">😌</p>
          <h2 className="text-lg font-light mb-1">{t("eye-exercise:rest")}</h2>
          <p className="text-sm text-neutral-400 mb-8">
            {t("eye-exercise:restDesc")}
          </p>

          {/* Countdown */}
          <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-2 border-neutral-200 dark:border-neutral-700 mb-8">
            <p className="text-5xl font-extralight tabular-nums">{countdown}</p>
          </div>

          {/* Next exercise preview card */}
          {nextExercise && (
            <div className="w-full max-w-sm rounded-2xl bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
              <div className="flex items-center p-3 gap-3">
                <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  <span className="text-2xl">{nextExercise.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-neutral-400 mb-0.5">
                    {t("eye-exercise:nextExercise")}
                  </p>
                  <p className="text-sm font-medium truncate">
                    {t(`eye-exercise:exercises.${nextExercise.id}.name`)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCurrentIndex((i) => i + 1);
                    setPhase("exercise");
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <SkipForward className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active exercise view
  const timerPct = currentExercise
    ? ((currentExercise.durationSec - countdown) / currentExercise.durationSec) * 100
    : 0;

  return (
    <div className="flex flex-col min-h-[70vh] px-4 py-6">
      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-neutral-400">
            {t("eye-exercise:exerciseProgress", {
              current: currentIndex + 1,
              total: exerciseIds.length,
            })}
          </p>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
            {EYE_EXERCISE_TARGET_LABELS[currentExercise.target]}
          </span>
        </div>
        <div className="h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Exercise info card */}
      <div className="w-full max-w-md mx-auto mt-4">
        <div className="rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800/50">
          <div className="w-full flex items-center justify-center" style={{ aspectRatio: "2.2" }}>
            <p className="text-5xl">{currentExercise.emoji}</p>
          </div>
          <div className="px-4 py-3">
            <h2 className="text-base font-medium">
              {t(`eye-exercise:exercises.${currentExercise.id}.name`)}
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              {t(`eye-exercise:exercises.${currentExercise.id}.desc`)}
            </p>
          </div>
        </div>
      </div>

      {/* Timer section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="text-6xl font-extralight tabular-nums">{countdown}</p>
        <p className="text-sm text-neutral-400 mt-1">
          {t("eye-exercise:seconds")} · {t("eye-exercise:reps", { count: currentExercise.reps })}
        </p>

        {/* Timer progress bar */}
        <div className="w-full max-w-xs mt-4">
          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000 linear"
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-primary/70 text-center max-w-xs mt-4">
          {t(`eye-exercise:exercises.${currentExercise.id}.tip`)}
        </p>
      </div>

      {/* Controls - anchored at bottom */}
      <div className="flex flex-col items-center pb-2">
        <div className="flex items-center gap-6">
          {/* Discard */}
          <button
            onClick={handleDiscard}
            disabled={discarding}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 text-destructive/70 hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {/* Skip / Complete early */}
          <button
            onClick={handleSkip}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <SkipForward className="h-6 w-6" strokeWidth={2} />
          </button>

          {/* Finish early */}
          <button
            onClick={handleFinishEarly}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 dark:border-white/10 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          >
            <Check className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
          <span>{t("eye-exercise:skip")}</span>
          <span>·</span>
          <span>{t("eye-exercise:complete")}</span>
        </div>
      </div>
    </div>
  );
}
