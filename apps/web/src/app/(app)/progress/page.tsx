"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc-client";
import { logWeight } from "@/server/actions/progress";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function ProgressPage() {
  const [weight, setWeight] = useState("");
  const [isPending, startTransition] = useTransition();

  const { data: weightHistory } = trpc.progress.getWeightHistory.useQuery({
    limit: 90,
  });
  const { data: latestWeight } = trpc.progress.getLatestWeight.useQuery();
  const { data: goals } = trpc.user.getGoals.useQuery();

  const targetWeight = goals?.targetWeightKg
    ? Number(goals.targetWeightKg)
    : null;
  const currentWeight = latestWeight
    ? Number(latestWeight.weightKg)
    : null;

  const handleLogWeight = () => {
    if (!weight) return;
    startTransition(async () => {
      await logWeight({
        date: format(new Date(), "yyyy-MM-dd"),
        weightKg: parseFloat(weight),
      });
      setWeight("");
    });
  };

  const chartData =
    weightHistory?.map((w) => ({
      date: format(new Date(w.date), "M/d"),
      weight: Number(w.weightKg),
    })) ?? [];

  const getTrendIcon = () => {
    if (!weightHistory || weightHistory.length < 2) return <Minus className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />;
    const latest = Number(weightHistory[weightHistory.length - 1].weightKg);
    const previous = Number(weightHistory[weightHistory.length - 2].weightKg);
    if (latest < previous) return <TrendingDown className="h-4 w-4 text-primary" strokeWidth={1.5} />;
    if (latest > previous) return <TrendingUp className="h-4 w-4 text-destructive" strokeWidth={1.5} />;
    return <Minus className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />;
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-light tracking-wide">進度追蹤</h1>

      {/* Weight Input */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          記錄體重
        </p>
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
            disabled={!weight || isPending}
            className="px-6 py-2 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20 disabled:opacity-30"
          >
            {isPending ? "..." : "記錄"}
          </button>
        </div>
        {currentWeight && (
          <div className="flex items-center gap-2 text-sm font-light text-neutral-500">
            <span>目前：{currentWeight} kg</span>
            {getTrendIcon()}
            {targetWeight && (
              <span className="ml-auto">
                目標：{targetWeight} kg
              </span>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            體重趨勢
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  opacity={0.3}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  opacity={0.3}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "4px",
                    border: "1px solid rgba(0,0,0,0.06)",
                    fontSize: "12px",
                    fontWeight: 300,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(142.1 76.2% 36.3%)"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                  name="體重 (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

      {/* Macro Weekly Summary placeholder */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          本週營養摘要
        </p>
        <p className="text-sm font-light text-neutral-400 text-center py-6">
          開始記錄食物後即可查看營養摘要
        </p>
      </div>
    </div>
  );
}
