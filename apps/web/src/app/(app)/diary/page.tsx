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
import { Button } from "@/components/ui/button";

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

  const calorieTarget = goals?.calorieTarget ? Number(goals.calorieTarget) : 2000;
  const proteinTarget = goals?.proteinG ? Number(goals.proteinG) : 150;
  const carbsTarget = goals?.carbsG ? Number(goals.carbsG) : 250;
  const fatTarget = goals?.fatG ? Number(goals.fatG) : 67;
  const fiberTarget = goals?.fiberG ? Number(goals.fiberG) : 28;

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
    <div className="pb-4">
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

      <div className="space-y-2 mt-2">
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
        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
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
        <div className="px-4 py-4 space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      }
    >
      <DiaryContent />
    </Suspense>
  );
}
