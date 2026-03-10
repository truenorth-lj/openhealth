"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
import Link from "next/link";
import {
  ChevronRight,
  Droplets,
  Scale,
  Footprints,
  Bot,
} from "lucide-react";
import { DateNavigator } from "@/components/diary/date-navigator";
import { DailySummary } from "@/components/diary/daily-summary";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { trpc } from "@/lib/trpc-client";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_CALORIE_TARGET,
  DEFAULT_PROTEIN_G,
  DEFAULT_CARBS_G,
  DEFAULT_FAT_G,
  DEFAULT_FIBER_G,
} from "@open-health/shared/constants";

function parseDateParam(param: string | null): Date {
  if (param) {
    const parsed = parseISO(param);
    if (isValid(parsed)) return parsed;
  }
  return new Date();
}

const WEIGHT_TREND_DAYS = 7;
const DEFAULT_WATER_GOAL_ML = 2000;

function TodayContent() {
  const { t } = useTranslation(["diary", "common", "ai", "progress"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = parseDateParam(searchParams.get("date"));
  const dateStr = format(date, "yyyy-MM-dd");

  const handleDateChange = useCallback(
    (newDate: Date) => {
      const newDateStr = format(newDate, "yyyy-MM-dd");
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const url = newDateStr === todayStr ? "/today" : `/today?date=${newDateStr}`;
      router.replace(url);
    },
    [router]
  );

  const { isAuthenticated, showLoginDialog, setShowLoginDialog } = useAuthGuard();

  const { data: diaryData } = trpc.diary.getDay.useQuery(
    { date: dateStr },
    { enabled: isAuthenticated }
  );
  const { data: goals } = trpc.user.getGoals.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: dateWeight } = trpc.progress.getDateWeight.useQuery(
    { date: dateStr },
    { enabled: isAuthenticated }
  );
  const { data: dateSteps } = trpc.progress.getDateSteps.useQuery(
    { date: dateStr },
    { enabled: isAuthenticated }
  );
  const { data: weightHistory } = trpc.progress.getWeightHistory.useQuery(
    { limit: WEIGHT_TREND_DAYS },
    { enabled: isAuthenticated }
  );
  const { data: waterData } = trpc.water.getToday.useQuery(
    { date: dateStr },
    { enabled: isAuthenticated }
  );

  const calorieTarget = goals?.calorieTarget ? Number(goals.calorieTarget) : DEFAULT_CALORIE_TARGET;
  const proteinTarget = goals?.proteinG ? Number(goals.proteinG) : DEFAULT_PROTEIN_G;
  const carbsTarget = goals?.carbsG ? Number(goals.carbsG) : DEFAULT_CARBS_G;
  const fatTarget = goals?.fatG ? Number(goals.fatG) : DEFAULT_FAT_G;
  const fiberTarget = goals?.fiberG ? Number(goals.fiberG) : DEFAULT_FIBER_G;

  const currentWeight = dateWeight ? Number(dateWeight.weightKg) : null;
  const currentSteps = dateSteps ? Number(dateSteps.steps) : null;
  const waterTotal = waterData?.totalMl ?? 0;
  const waterGoal = waterData?.goalMl ?? DEFAULT_WATER_GOAL_ML;

  const weightTrend = (() => {
    if (!weightHistory || weightHistory.length < 2) return null;
    const latest = Number(weightHistory[weightHistory.length - 1].weightKg);
    const first = Number(weightHistory[0].weightKg);
    return +(latest - first).toFixed(1);
  })();

  return (
    <div className="pb-6 space-y-1">
      <DateNavigator date={date} onDateChange={handleDateChange} />

      {/* Calorie Card */}
      <Link href={`/hub/diary?date=${dateStr}`} className="block">
        <div className="mx-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06] transition-all duration-300 hover:pl-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
              {t("diary:calorieIntake")}
            </p>
            <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
          </div>
          <DailySummary
            calories={diaryData?.totals.calories ?? 0}
            protein={diaryData?.totals.protein ?? 0}
            carbs={diaryData?.totals.carbs ?? 0}
            fat={diaryData?.totals.fat ?? 0}
            fiber={diaryData?.totals.fiber ?? 0}
            calorieTarget={calorieTarget}
            proteinTarget={proteinTarget}
            carbsTarget={carbsTarget}
            fatTarget={fatTarget}
            fiberTarget={fiberTarget}
          />
        </div>
      </Link>

      {/* Water Card */}
      <Link href={`/hub/water?date=${dateStr}`} className="block">
        <div className="mx-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06] transition-all duration-300 hover:pl-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
              <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
                {t("common:hub.items.water")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-light tabular-nums">{waterTotal.toLocaleString()}</span>
            <span className="text-sm font-light text-neutral-400">/ {waterGoal.toLocaleString()} ml</span>
          </div>
          {/* Progress bar */}
          <div className="h-1 rounded-full bg-neutral-100 dark:bg-neutral-900">
            <div
              className="h-full rounded-full bg-sky-400/60 transition-all duration-500"
              style={{ width: `${Math.min((waterTotal / waterGoal) * 100, 100)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Weight Card */}
      <Link href="/hub/progress" className="block">
        <div className="mx-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06] transition-all duration-300 hover:pl-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
              <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
                {t("progress:weightLabel")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-light tabular-nums">
              {currentWeight !== null ? currentWeight : "--"}
            </span>
            <span className="text-sm font-light text-neutral-400">kg</span>
            {weightTrend !== null && (
              <span className={`text-xs font-light ${weightTrend < 0 ? "text-primary" : weightTrend > 0 ? "text-destructive" : "text-neutral-400"}`}>
                {weightTrend > 0 ? "+" : ""}{weightTrend} kg ({WEIGHT_TREND_DAYS}{t("common:time.days")})
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Steps Card */}
      <Link href="/hub/progress" className="block">
        <div className="mx-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06] transition-all duration-300 hover:pl-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
              <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
                {t("progress:stepsLabel")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light tabular-nums">
              {currentSteps !== null ? currentSteps.toLocaleString() : "--"}
            </span>
            <span className="text-sm font-light text-neutral-400">{t("common:units.steps")}</span>
          </div>
        </div>
      </Link>

      {/* AI Card */}
      <Link href="/hub/chat" className="block">
        <div className="mx-4 py-4 transition-all duration-300 hover:pl-1">
          <div className="flex items-center gap-3">
            <Bot className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-light">{t("ai:todayCard.title")}</p>
              <p className="text-xs font-light text-neutral-400 dark:text-neutral-600">
                {t("ai:todayCard.description")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
          </div>
        </div>
      </Link>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 space-y-4">
          <div className="h-10 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      }
    >
      <TodayContent />
    </Suspense>
  );
}
