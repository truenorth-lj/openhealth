"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc-client";
import { logWeight, logSteps } from "@/server/actions/progress";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Footprints,
  Scale,
  BarChart3,
} from "lucide-react";

export default function ProgressPage() {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [steps, setSteps] = useState("");
  const [isPendingWeight, startWeightTransition] = useTransition();
  const [isPendingSteps, startStepsTransition] = useTransition();

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: latestWeight } = trpc.progress.getLatestWeight.useQuery();
  const { data: todaySteps } = trpc.progress.getTodaySteps.useQuery({ date: today });
  const { data: goals } = trpc.user.getGoals.useQuery();
  const { data: weightHistory } = trpc.progress.getWeightHistory.useQuery({ limit: 7 });
  const { data: stepsHistory } = trpc.progress.getStepsHistory.useQuery({ limit: 7 });

  const targetWeight = goals?.targetWeightKg ? Number(goals.targetWeightKg) : null;
  const currentWeight = latestWeight ? Number(latestWeight.weightKg) : null;
  const currentSteps = todaySteps ? Number(todaySteps.steps) : null;

  const handleLogWeight = () => {
    if (!weight) return;
    startWeightTransition(async () => {
      await logWeight({ date: today, weightKg: parseFloat(weight) });
      setWeight("");
      router.refresh();
    });
  };

  const handleLogSteps = () => {
    if (!steps) return;
    startStepsTransition(async () => {
      await logSteps({ date: today, steps: parseInt(steps, 10) });
      setSteps("");
      router.refresh();
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

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light tracking-wide">進度追蹤</h1>
        <button
          onClick={() => router.push("/progress/analysis")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20"
        >
          <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} />
          趨勢分析
        </button>
      </div>

      {/* Weight Card */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            記錄體重
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.1"
            placeholder="體重 (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1 border-black/[0.06] dark:border-white/[0.06] font-light"
          />
          <button
            onClick={handleLogWeight}
            disabled={!weight || isPendingWeight}
            className="px-6 py-2 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20 disabled:opacity-30"
          >
            {isPendingWeight ? "..." : "記錄"}
          </button>
        </div>
        {currentWeight && (
          <div className="flex items-center gap-2 text-sm font-light text-neutral-500">
            <span>目前：{currentWeight} kg</span>
            {getTrendIcon()}
            {targetWeight && (
              <span className="ml-auto">目標：{targetWeight} kg</span>
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
            記錄步數
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            step="1"
            placeholder="步數"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            className="flex-1 border-black/[0.06] dark:border-white/[0.06] font-light"
          />
          <button
            onClick={handleLogSteps}
            disabled={!steps || isPendingSteps}
            className="px-6 py-2 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20 disabled:opacity-30"
          >
            {isPendingSteps ? "..." : "記錄"}
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm font-light text-neutral-500">
          {currentSteps !== null ? (
            <span>今日：{currentSteps.toLocaleString()} 步</span>
          ) : (
            <span>今日尚無記錄</span>
          )}
          {recentStepsAvg !== null && (
            <span className="ml-auto">
              近 {stepsHistory!.length} 天平均：{recentStepsAvg.toLocaleString()} 步
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

      {/* Quick Summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="體重"
          value={currentWeight ? `${currentWeight}` : "--"}
          unit="kg"
        />
        <SummaryCard
          label="今日步數"
          value={currentSteps !== null ? currentSteps.toLocaleString() : "--"}
          unit="步"
        />
        <SummaryCard
          label="7 天平均步數"
          value={recentStepsAvg !== null ? recentStepsAvg.toLocaleString() : "--"}
          unit="步"
        />
      </div>
    </div>
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
