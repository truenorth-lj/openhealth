"use client";

import { Suspense, useState, useCallback, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc-client";
import { logWeight, logSteps } from "@/server/actions/progress";
import { format, parseISO, isValid, isToday } from "date-fns";
import { DateNavigator } from "@/components/diary/date-navigator";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Footprints,
  Scale,
  BarChart3,
} from "lucide-react";
import { useTranslation } from "react-i18next";

function parseDateParam(param: string | null): Date {
  if (param) {
    const parsed = parseISO(param);
    if (isValid(parsed)) return parsed;
  }
  return new Date();
}

function ProgressContent() {
  const { t } = useTranslation(["progress", "common"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = parseDateParam(searchParams.get("date"));
  const dateStr = format(date, "yyyy-MM-dd");

  const [weight, setWeight] = useState("");
  const [steps, setSteps] = useState("");
  const [isPendingWeight, startWeightTransition] = useTransition();
  const [isPendingSteps, startStepsTransition] = useTransition();

  const utils = trpc.useUtils();

  const { data: dateWeight } = trpc.progress.getDateWeight.useQuery({ date: dateStr });
  const { data: dateSteps } = trpc.progress.getDateSteps.useQuery({ date: dateStr });
  const { data: goals } = trpc.user.getGoals.useQuery();
  const { data: weightHistory } = trpc.progress.getWeightHistory.useQuery({ limit: 7 });
  const { data: stepsHistory } = trpc.progress.getStepsHistory.useQuery({ limit: 7 });

  const targetWeight = goals?.targetWeightKg ? Number(goals.targetWeightKg) : null;
  const currentWeight = dateWeight ? Number(dateWeight.weightKg) : null;
  const currentSteps = dateSteps ? Number(dateSteps.steps) : null;

  // Pre-fill inputs when existing records load
  useEffect(() => {
    setWeight(currentWeight !== null ? String(currentWeight) : "");
  }, [currentWeight, dateStr]);

  useEffect(() => {
    setSteps(currentSteps !== null ? String(currentSteps) : "");
  }, [currentSteps, dateStr]);

  const handleDateChange = useCallback(
    (newDate: Date) => {
      const newDateStr = format(newDate, "yyyy-MM-dd");
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const url = newDateStr === todayStr ? "/hub/progress" : `/hub/progress?date=${newDateStr}`;
      router.replace(url);
    },
    [router]
  );

  const handleLogWeight = () => {
    if (!weight) return;
    startWeightTransition(async () => {
      await logWeight({ date: dateStr, weightKg: parseFloat(weight) });
      await utils.progress.invalidate();
    });
  };

  const handleLogSteps = () => {
    if (!steps) return;
    startStepsTransition(async () => {
      await logSteps({ date: dateStr, steps: parseInt(steps, 10) });
      await utils.progress.invalidate();
    });
  };

  const getTrendIcon = () => {
    if (!weightHistory || weightHistory.length < 2)
      return <Minus className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />;
    const latest = Number(weightHistory[weightHistory.length - 1].weightKg);
    const previous = Number(weightHistory[weightHistory.length - 2].weightKg);
    if (latest < previous)
      return <TrendingDown className="h-4 w-4 text-primary" strokeWidth={1.5} />;
    if (latest > previous)
      return <TrendingUp className="h-4 w-4 text-destructive" strokeWidth={1.5} />;
    return <Minus className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />;
  };

  const recentStepsAvg =
    stepsHistory && stepsHistory.length > 0
      ? Math.round(
          stepsHistory.reduce((sum, s) => sum + Number(s.steps), 0) / stepsHistory.length
        )
      : null;

  const dayLabel = isToday(date) ? t("common:time.todayShort") : format(date, "M/d");

  return (
    <div className="space-y-6">
      <DateNavigator date={date} onDateChange={handleDateChange} />

      <div className="px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-light tracking-wide">{t("progress:progressTracking")}</h1>
          <button
            onClick={() => router.push("/hub/progress/analysis")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20"
          >
            <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t("progress:trendAnalysis")}
          </button>
        </div>

        {/* Weight Card */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
              {t("progress:logWeight")}
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder={`${t("progress:weightLabel")} (kg)`}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="flex-1 border-black/[0.06] dark:border-white/[0.06] font-light"
            />
            <button
              onClick={handleLogWeight}
              disabled={!weight || isPendingWeight}
              className="px-6 py-2 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20 disabled:opacity-30"
            >
              {isPendingWeight ? "..." : currentWeight !== null ? t("common:buttons.update") : t("common:buttons.record")}
            </button>
          </div>
          {currentWeight !== null && (
            <div className="flex items-center gap-2 text-sm font-light text-neutral-500">
              <span>{dayLabel}：{currentWeight} kg</span>
              {getTrendIcon()}
              {targetWeight && (
                <span className="ml-auto">{t("common:labels.target")}：{targetWeight} kg</span>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

        {/* Steps Card */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Footprints className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
              {t("progress:logSteps")}
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              step="1"
              placeholder={t("progress:stepsPlaceholder")}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="flex-1 border-black/[0.06] dark:border-white/[0.06] font-light"
            />
            <button
              onClick={handleLogSteps}
              disabled={!steps || isPendingSteps}
              className="px-6 py-2 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20 disabled:opacity-30"
            >
              {isPendingSteps ? "..." : currentSteps !== null ? t("common:buttons.update") : t("common:buttons.record")}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm font-light text-neutral-500">
            {currentSteps !== null ? (
              <span>{dayLabel}: {currentSteps.toLocaleString()} {t("common:units.steps")}</span>
            ) : (
              <span>{dayLabel} {t("progress:noRecord")}</span>
            )}
            {recentStepsAvg !== null && (
              <span className="ml-auto">
                {t("progress:recentDaysAvg", { count: stepsHistory!.length, avg: recentStepsAvg.toLocaleString() })}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

        {/* Quick Summary */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            label={t("progress:weightLabel")}
            value={currentWeight ? `${currentWeight}` : "--"}
            unit="kg"
          />
          <SummaryCard
            label={t("progress:todaySteps", { day: dayLabel })}
            value={currentSteps !== null ? currentSteps.toLocaleString() : "--"}
            unit={t("common:units.steps")}
          />
          <SummaryCard
            label={t("progress:sevenDayAvgSteps")}
            value={recentStepsAvg !== null ? recentStepsAvg.toLocaleString() : "--"}
            unit={t("common:units.steps")}
          />
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6"><p className="text-center text-neutral-400 font-light">...</p></div>}>
      <ProgressContent />
    </Suspense>
  );
}

function SummaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center py-4 border border-black/[0.06] dark:border-white/[0.06] rounded-lg">
      <p className="text-[9px] tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-600 mb-1">
        {label}
      </p>
      <p className="text-lg font-light tabular-nums">{value}</p>
      <p className="text-[10px] font-light text-neutral-400">{unit}</p>
    </div>
  );
}
