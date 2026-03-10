"use client";

import { useTranslation } from "react-i18next";
import { MicroNutrientSection } from "./micro-nutrient-section";

interface DailySummaryProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  fiberTarget: number;
  exerciseCalories?: number;
  date?: string;
  trackedNutrientIds?: number[];
}

export function DailySummary({
  calories,
  protein,
  carbs,
  fat,
  fiber,
  calorieTarget,
  proteinTarget,
  carbsTarget,
  fatTarget,
  fiberTarget,
  exerciseCalories = 0,
  date,
  trackedNutrientIds = [],
}: DailySummaryProps) {
  const { t } = useTranslation("common");
  const remaining = calorieTarget - calories + exerciseCalories;
  const caloriePercent = calorieTarget > 0 ? Math.min((calories / calorieTarget) * 100, 100) : 0;

  return (
    <div className="mx-4 space-y-5 py-2">
      {/* Calorie Summary */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-extralight tabular-nums">{Math.round(calories)}</p>
          <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-600 mt-1">{t("labels.consumed")}</p>
        </div>
        <div className="text-right">
          <p
            className={`text-3xl font-extralight tabular-nums ${
              remaining >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {Math.round(remaining)}
          </p>
          <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-600 mt-1">{t("labels.remaining")}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extralight tabular-nums text-neutral-300 dark:text-neutral-700">
            {calorieTarget}
          </p>
          <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-600 mt-1">{t("labels.target")}</p>
        </div>
      </div>

      {/* Exercise calories */}
      {exerciseCalories > 0 && (
        <div className="flex items-center justify-end gap-1 text-xs text-orange-500">
          <span className="tabular-nums">+{Math.round(exerciseCalories)}</span>
          <span>{t("labels.exerciseBurned")}</span>
        </div>
      )}

      {/* Minimal progress bar */}
      <div className="h-px bg-neutral-200 dark:bg-neutral-800 relative">
        <div
          className="absolute left-0 top-0 h-px bg-primary transition-all duration-500"
          style={{ width: `${caloriePercent}%` }}
        />
      </div>

      {/* Macro Summary */}
      <div className="grid grid-cols-4 gap-4">
        <MacroItem
          label={t("macro.protein")}
          current={protein}
          target={proteinTarget}
          color="bg-blue-500"
        />
        <MacroItem
          label={t("macro.carbs")}
          current={carbs}
          target={carbsTarget}
          color="bg-amber-500"
        />
        <MacroItem
          label={t("macro.fat")}
          current={fat}
          target={fatTarget}
          color="bg-rose-500"
        />
        <MacroItem
          label={t("macro.fiber")}
          current={fiber}
          target={fiberTarget}
          color="bg-emerald-500"
        />
      </div>

      {/* Micro Nutrients */}
      {date && (
        <MicroNutrientSection
          date={date}
          trackedNutrientIds={trackedNutrientIds}
        />
      )}
    </div>
  );
}

function MacroItem({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-neutral-400 dark:text-neutral-600">{label}</p>
      <p className="text-sm font-light tabular-nums">
        {current.toFixed(0)}<span className="text-neutral-300 dark:text-neutral-700">/{target}g</span>
      </p>
      <div className="h-px bg-neutral-200 dark:bg-neutral-800 relative">
        <div
          className={`absolute left-0 top-0 h-px ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
