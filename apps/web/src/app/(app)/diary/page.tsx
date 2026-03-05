"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO, isValid } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DateNavigator } from "@/components/diary/date-navigator";
import { DailySummary } from "@/components/diary/daily-summary";
import { MealSection } from "@/components/diary/meal-section";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { trpc } from "@/lib/trpc-client";
import {
  DEFAULT_CALORIE_TARGET,
  DEFAULT_PROTEIN_G,
  DEFAULT_CARBS_G,
  DEFAULT_FAT_G,
  DEFAULT_FIBER_G,
} from "@open-health/shared/constants";

const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

function parseDateParam(param: string | null): Date {
  if (param) {
    const parsed = parseISO(param);
    if (isValid(parsed)) return parsed;
  }
  return new Date();
}

function DiaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = parseDateParam(searchParams.get("date"));
  const dateStr = format(date, "yyyy-MM-dd");

  const handleDateChange = useCallback(
    (newDate: Date) => {
      const newDateStr = format(newDate, "yyyy-MM-dd");
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const url = newDateStr === todayStr ? "/diary" : `/diary?date=${newDateStr}`;
      router.replace(url);
    },
    [router]
  );
  const { isAuthenticated, showLoginDialog, setShowLoginDialog } = useAuthGuard();

  const { data } = trpc.diary.getDay.useQuery(
    { date: dateStr },
    { enabled: isAuthenticated }
  );
  const { data: goals } = trpc.user.getGoals.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const calorieTarget = goals?.calorieTarget ? Number(goals.calorieTarget) : DEFAULT_CALORIE_TARGET;
  const proteinTarget = goals?.proteinG ? Number(goals.proteinG) : DEFAULT_PROTEIN_G;
  const carbsTarget = goals?.carbsG ? Number(goals.carbsG) : DEFAULT_CARBS_G;
  const fatTarget = goals?.fatG ? Number(goals.fatG) : DEFAULT_FAT_G;
  const fiberTarget = goals?.fiberG ? Number(goals.fiberG) : DEFAULT_FIBER_G;

  const entries = data?.entries ?? [];
  const getEntriesForMeal = (meal: string) =>
    entries.filter((e) => e.mealType === meal);

  const handleRequireAuth = () => {
    setShowLoginDialog(true);
  };

  const handleFabClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowLoginDialog(true);
    }
  };

  return (
    <div className="pb-6">
      <DateNavigator date={date} onDateChange={handleDateChange} />

      <DailySummary
        calories={data?.totals.calories ?? 0}
        protein={data?.totals.protein ?? 0}
        carbs={data?.totals.carbs ?? 0}
        fat={data?.totals.fat ?? 0}
        fiber={data?.totals.fiber ?? 0}
        calorieTarget={calorieTarget}
        proteinTarget={proteinTarget}
        carbsTarget={carbsTarget}
        fatTarget={fatTarget}
        fiberTarget={fiberTarget}
      />

      <div className="mt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
        {mealTypes.map((meal) => (
          <MealSection
            key={meal}
            mealType={meal}
            entries={getEntriesForMeal(meal)}
            date={dateStr}
            isAuthenticated={isAuthenticated}
            onRequireAuth={handleRequireAuth}
          />
        ))}
      </div>

      {/* Floating Action Button */}
      <Link
        href={`/food/search?date=${dateStr}&meal=snack`}
        className="fixed bottom-20 right-4 z-50"
        onClick={handleFabClick}
      >
        <button className="flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-background text-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:border-foreground/20">
          <Plus className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </Link>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />
    </div>
  );
}

export default function DiaryPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 space-y-4">
          <div className="h-10 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="h-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          ))}
        </div>
      }
    >
      <DiaryContent />
    </Suspense>
  );
}
