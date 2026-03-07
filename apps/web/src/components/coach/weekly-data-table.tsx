"use client";

import { cn } from "@/lib/utils";

interface DayData {
  date: string;
  weightKg: number | null;
  steps: number | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

interface Averages {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  weightKg: number | null;
  steps: number | null;
}

interface WeeklyDataTableProps {
  days: DayData[];
  averages: Averages;
  calorieTarget?: number | null;
}

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const CALORIE_OVERAGE_MULTIPLIER = 1.1;

export function WeeklyDataTable({
  days,
  averages,
  calorieTarget,
}: WeeklyDataTableProps) {
  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    return DAY_LABELS[day === 0 ? 6 : day - 1];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
            <th className="py-2 px-3 text-left font-light text-neutral-400 dark:text-neutral-600 text-xs">
              日期
            </th>
            <th className="py-2 px-3 text-right font-light text-neutral-400 dark:text-neutral-600 text-xs">
              體重
            </th>
            <th className="py-2 px-3 text-right font-light text-neutral-400 dark:text-neutral-600 text-xs">
              步數
            </th>
            <th className="py-2 px-3 text-right font-light text-neutral-400 dark:text-neutral-600 text-xs">
              熱量
            </th>
            <th className="py-2 px-3 text-right font-light text-neutral-400 dark:text-neutral-600 text-xs">
              蛋白質
            </th>
            <th className="py-2 px-3 text-right font-light text-neutral-400 dark:text-neutral-600 text-xs">
              碳水
            </th>
            <th className="py-2 px-3 text-right font-light text-neutral-400 dark:text-neutral-600 text-xs">
              脂肪
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr
              key={day.date}
              className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
            >
              <td className="py-2.5 px-3">
                <span className="text-xs text-neutral-400 mr-1">
                  {getDayLabel(day.date)}
                </span>
                <span className="font-light">{formatDate(day.date)}</span>
              </td>
              <td className="py-2.5 px-3 text-right font-light">
                {day.weightKg != null ? `${day.weightKg.toFixed(1)}` : "-"}
              </td>
              <td className="py-2.5 px-3 text-right font-light">
                {day.steps != null ? day.steps.toLocaleString() : "-"}
              </td>
              <td
                className={cn(
                  "py-2.5 px-3 text-right font-light",
                  calorieTarget &&
                    day.calories != null &&
                    day.calories > calorieTarget * CALORIE_OVERAGE_MULTIPLIER &&
                    "text-red-500"
                )}
              >
                {day.calories != null ? Math.round(day.calories) : "-"}
              </td>
              <td className="py-2.5 px-3 text-right font-light">
                {day.proteinG != null ? Math.round(day.proteinG) : "-"}
              </td>
              <td className="py-2.5 px-3 text-right font-light">
                {day.carbsG != null ? Math.round(day.carbsG) : "-"}
              </td>
              <td className="py-2.5 px-3 text-right font-light">
                {day.fatG != null ? Math.round(day.fatG) : "-"}
              </td>
            </tr>
          ))}
          {/* Averages row */}
          <tr className="bg-black/[0.02] dark:bg-white/[0.02] font-medium">
            <td className="py-2.5 px-3 text-xs text-neutral-500">週平均</td>
            <td className="py-2.5 px-3 text-right">
              {averages.weightKg != null ? averages.weightKg.toFixed(1) : "-"}
            </td>
            <td className="py-2.5 px-3 text-right">
              {averages.steps != null ? averages.steps.toLocaleString() : "-"}
            </td>
            <td className="py-2.5 px-3 text-right">
              {averages.calories != null ? averages.calories : "-"}
            </td>
            <td className="py-2.5 px-3 text-right">
              {averages.proteinG != null ? averages.proteinG : "-"}
            </td>
            <td className="py-2.5 px-3 text-right">
              {averages.carbsG != null ? averages.carbsG : "-"}
            </td>
            <td className="py-2.5 px-3 text-right">
              {averages.fatG != null ? averages.fatG : "-"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
