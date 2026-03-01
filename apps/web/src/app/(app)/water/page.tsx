"use client";

import { useState } from "react";
import { Droplets, Plus, Minus } from "lucide-react";

const quickAmounts = [150, 250, 350, 500];

export default function WaterPage() {
  const [todayTotal, setTodayTotal] = useState(0);
  const dailyTarget = 2500;

  const addWater = (ml: number) => {
    setTodayTotal((prev) => Math.max(0, prev + ml));
  };

  const percentage = Math.min((todayTotal / dailyTarget) * 100, 100);

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-light tracking-wide">水分追蹤</h1>

      {/* Circular progress */}
      <div className="flex flex-col items-center py-6">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="h-40 w-40 -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-neutral-200 dark:text-neutral-800"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray={`${percentage * 4.4} ${440 - percentage * 4.4}`}
              strokeLinecap="round"
              className="text-blue-500 transition-all duration-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <Droplets className="h-5 w-5 text-blue-500 mb-1" strokeWidth={1.5} />
            <span className="text-3xl font-extralight tabular-nums">{todayTotal}</span>
            <span className="text-xs font-light text-neutral-400 dark:text-neutral-600">/ {dailyTarget} ml</span>
          </div>
        </div>

        <p className="mt-4 text-sm font-light text-neutral-400">
          {percentage >= 100
            ? "已達到今日目標！"
            : `還需 ${dailyTarget - todayTotal} ml`}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

      {/* Quick Add */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          快速新增
        </p>
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((ml) => (
            <button
              key={ml}
              onClick={() => addWater(ml)}
              className="flex flex-col items-center gap-1 py-3 border border-black/[0.06] dark:border-white/[0.06] rounded-lg text-sm font-light transition-all duration-300 hover:border-foreground/20"
            >
              <Plus className="h-3 w-3 text-neutral-400" strokeWidth={1.5} />
              <span>{ml} ml</span>
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => addWater(-250)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-light text-neutral-400 transition-all duration-300 hover:text-foreground"
          >
            <Minus className="h-3 w-3" strokeWidth={1.5} />
            減少 250ml
          </button>
        </div>
      </div>
    </div>
  );
}
