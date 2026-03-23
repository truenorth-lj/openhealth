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
  THROAT_EXERCISES,
  THROAT_EXERCISE_TARGET_LABELS,
  THROAT_EXERCISE_REST_SEC,
} from "@open-health/shared/constants";
import type { ThroatExerciseMetadata } from "@open-health/shared/types";

type Phase = "exercise" | "rest" | "complete";

export default function ActiveThroatExercisePage() {
  const router = useRouter();
  const { t } = useTranslation(["throat-exercise", "common"]);
  const { isAuthenticated } = useAuthGuard();

  const {
    data: activeSession,
    isLoading,
    isFetching,
  } = trpc.activity.getActive.useQuery(
    { type: "throat_exercise" },
    { enabled: isAuthenticated, staleTime: 0 }
  );

  const utils = trpc.useUtils();

  const meta =
    activeSession?.metadata as unknown as ThroatExerciseMetadata | null;
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
  const currentExercise = THROAT_EXERCISES.find(
    (e) => e.id === currentExerciseId
  );

  // Initialize countdown when exercise/phase changes
  useEffect(() => {
    if (phase === "exercise" && currentExercise) {
      setCountdown(currentExercise.durationSec);
    } else if (phase === "rest") {
      setCountdown(THROAT_EXERCISE_REST_SEC);
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
          // Timer finished
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
      const metadata: Partial<ThroatExerciseMetadata> = {
        completed: true,
        completedCount,
      };
      await completeActivitySession({
        sessionId: activeSession.id,
        note: note || undefined,
        metadata: metadata as Record<string, unknown>,
      });
      await utils.activity.invalidate();
      toast.success(t("throat-exercise:sessionComplete"));
      router.push("/hub/throat-exercise");
      router.refresh();
    } catch {
      toast.error(t("common:toast.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!activeSession) return;
    const confirmed = window.confirm(t("throat-exercise:discardConfirm"));
    if (!confirmed) return;
    setDiscarding(true);
    try {
      await discardActivitySession({ sessionId: activeSession.id });
      await utils.activity.invalidate();
      router.push("/hub/throat-exercise");
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
      router.push("/hub/throat-exercise");
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
            {t("throat-exercise:wellDone")}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {t("throat-exercise:sessionSummary")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 text-center">
            <p className="text-2xl font-light tabular-nums text-primary">
              {completedCount}/{exerciseIds.length}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {t("throat-exercise:exercisesCompleted")}
            </p>
          </div>
          <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 text-center">
            <p className="text-2xl font-light tabular-nums text-primary">
              {formatDuration(totalElapsed)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {t("throat-exercise:totalTime")}
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <p className="text-sm font-light">{t("throat-exercise:note")}</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("throat-exercise:notePlaceholder")}
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
            {t("throat-exercise:cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
          >
            {saving
              ? t("throat-exercise:saving")
              : t("throat-exercise:save")}
          </button>
        </div>
      </div>
    );
  }

  // Rest screen
  if (phase === "rest") {
    const nextExerciseId = exerciseIds[currentIndex + 1];
    const nextExercise = THROAT_EXERCISES.find((e) => e.id === nextExerciseId);

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-6">
        {/* Progress bar */}
        <div className="w-full max-w-xs mb-8">
          <div className="h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 text-center mt-2">
            {t("throat-exercise:exerciseProgress", {
              current: currentIndex + 1,
              total: exerciseIds.length,
            })}
          </p>
        </div>

        <p className="text-4xl mb-4">😌</p>
        <h2 className="text-lg font-light mb-1">{t("throat-exercise:rest")}</h2>
        <p className="text-sm text-neutral-400 mb-6">
          {t("throat-exercise:restDesc")}
        </p>

        {/* Countdown */}
        <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-2 border-neutral-200 dark:border-neutral-700 mb-6">
          <p className="text-4xl font-extralight tabular-nums">{countdown}</p>
        </div>

        {/* Next exercise preview */}
        {nextExercise && (
          <div className="text-center">
            <p className="text-xs text-neutral-400 mb-1">
              {t("throat-exercise:nextExercise")}
            </p>
            <p className="text-sm">
              {nextExercise.emoji}{" "}
              {t(`throat-exercise:exercises.${nextExercise.id}.name`)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Active exercise view
  const timerPct = currentExercise
    ? ((currentExercise.durationSec - countdown) / currentExercise.durationSec) * 100
    : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-6">
      {/* Progress bar */}
      <div className="w-full max-w-xs mb-6">
        <div className="h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-neutral-400 text-center mt-2">
          {t("throat-exercise:exerciseProgress", {
            current: currentIndex + 1,
            total: exerciseIds.length,
          })}
        </p>
      </div>

      {/* Target badge */}
      <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] mb-3">
        {THROAT_EXERCISE_TARGET_LABELS[currentExercise.target]}
      </span>

      {/* Exercise emoji & name */}
      <p className="text-5xl mb-3">{currentExercise.emoji}</p>
      <h2 className="text-lg font-light mb-1">
        {t(`throat-exercise:exercises.${currentExercise.id}.name`)}
      </h2>
      <p className="text-sm text-neutral-400 text-center max-w-xs mb-2">
        {t(`throat-exercise:exercises.${currentExercise.id}.desc`)}
      </p>
      <p className="text-xs text-primary/70 text-center max-w-xs mb-6">
        {t(`throat-exercise:exercises.${currentExercise.id}.tip`)}
      </p>

      {/* Countdown circle */}
      <div className="relative flex items-center justify-center w-40 h-40 mb-6">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            className="text-neutral-200 dark:text-neutral-800"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 46}`}
            strokeDashoffset={`${2 * Math.PI * 46 * (1 - timerPct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="text-center">
          <p className="text-4xl font-extralight tabular-nums">{countdown}</p>
          <p className="text-[10px] text-neutral-400 mt-1">
            {t("throat-exercise:reps", { count: currentExercise.reps })}
          </p>
        </div>
      </div>

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

      <div className="flex items-center gap-4 mt-4 text-xs text-neutral-400">
        <span>{t("throat-exercise:skip")}</span>
        <span>·</span>
        <span>{t("throat-exercise:complete")}</span>
      </div>
    </div>
  );
}
