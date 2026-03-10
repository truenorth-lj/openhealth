"use client";

import { Dumbbell, Flame } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface ExerciseLog {
  id: string;
  exerciseName: string;
  exerciseCategory: string | null;
  durationMin: number | null;
  caloriesBurned: string | null;
}

interface ExerciseSectionProps {
  logs: ExerciseLog[];
  totalCalories: number;
}

export function ExerciseSection({ logs, totalCalories }: ExerciseSectionProps) {
  const { t } = useTranslation(["diary", "common", "exercise"]);
  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-orange-500" strokeWidth={1.5} />
          <h3 className="text-sm font-light">{t("diary:exerciseLabel")}</h3>
          {totalCalories > 0 && (
            <span className="text-xs text-orange-500 tabular-nums flex items-center gap-0.5">
              <Flame className="h-3 w-3" strokeWidth={1.5} />
              {Math.round(totalCalories)} kcal
            </span>
          )}
        </div>
        <Link href="/hub/exercise">
          <button className="p-1.5 text-neutral-400 transition-all duration-300 hover:text-foreground">
            <Dumbbell className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </Link>
      </div>

      {logs.length === 0 ? (
        <Link
          href="/hub/exercise"
          className="block border-b border-dashed border-black/[0.06] dark:border-white/[0.06] py-3 text-center text-sm font-light text-neutral-400 transition-all duration-300 hover:text-orange-500"
        >
          {t("diary:clickToAddExercise")}
        </Link>
      ) : (
        <div>
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-light truncate">{log.exerciseName}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-600">
                  {log.durationMin} {t("common:time.minutes")}
                  {log.exerciseCategory && ` · ${t(`exercise:categories.${log.exerciseCategory}`, { defaultValue: log.exerciseCategory })}`}
                </p>
              </div>
              <span className="text-sm font-light tabular-nums text-orange-500 ml-2">
                {Math.round(Number(log.caloriesBurned || 0))} kcal
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
