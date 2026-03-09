"use client";

import { Suspense, useState, useCallback, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc-client";
import { logWeight } from "@/server/actions/progress";
import { format, parseISO, isValid, isToday } from "date-fns";
import { DateNavigator } from "@/components/diary/date-navigator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Scale,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function parseDateParam(param: string | null): Date {
  if (param) {
    const parsed = parseISO(param);
    if (isValid(parsed)) return parsed;
  }
  return new Date();
}

const RANGES = [
  { label: "7 天", days: 7 },
  { label: "30 天", days: 30 },
  { label: "90 天", days: 90 },
] as const;

function WeightContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = parseDateParam(searchParams.get("date"));
  const dateStr = format(date, "yyyy-MM-dd");

  const [weight, setWeight] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedRange, setSelectedRange] = useState(30);

  const utils = trpc.useUtils();

  const { data: dateWeight, isLoading } = trpc.progress.getDateWeight.useQuery({ date: dateStr });
  const { data: goals } = trpc.user.getGoals.useQuery();
  const { data: weightHistory } = trpc.progress.getWeightHistory.useQuery({ limit: 7 });
  const { data: analytics } = trpc.progress.getAnalytics.useQuery({ days: selectedRange });

  const targetWeight = goals?.targetWeightKg ? Number(goals.targetWeightKg) : null;
  const currentWeight = dateWeight ? Number(dateWeight.weightKg) : null;

  useEffect(() => {
    setWeight(currentWeight !== null ? String(currentWeight) : "");
  }, [currentWeight, dateStr]);

  const handleDateChange = useCallback(
    (newDate: Date) => {
      const newDateStr = format(newDate, "yyyy-MM-dd");
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const url = newDateStr === todayStr ? "/weight" : `/weight?date=${newDateStr}`;
      router.replace(url);
    },
    [router]
  );

  const handleLogWeight = () => {
    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum)) return;
    startTransition(async () => {
      await logWeight({ date: dateStr, weightKg: weightNum });
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

  const dayLabel = isToday(date) ? "今日" : format(date, "M/d");

  const weightData =
    analytics?.weight.map((w) => ({
      date: format(new Date(w.date), "M/d"),
      value: w.value,
    })) ?? [];

  const latestWeight = weightHistory?.length
    ? Number(weightHistory[weightHistory.length - 1].weightKg)
    : null;
  const oldestWeight = weightHistory?.length
    ? Number(weightHistory[0].weightKg)
    : null;
  const weekChange =
    latestWeight !== null && oldestWeight !== null
      ? +(latestWeight - oldestWeight).toFixed(1)
      : null;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <DateNavigator date={date} onDateChange={handleDateChange} />

      <div className="px-4 space-y-6">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />
          <h1 className="text-xl font-light tracking-wide">體重紀錄</h1>
        </div>

        {/* Input */}
        <div className="space-y-3">
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
              {isPending ? "..." : currentWeight !== null ? "更新" : "記錄"}
            </button>
          </div>
          {currentWeight !== null && (
            <div className="flex items-center gap-2 text-sm font-light text-neutral-500">
              <span>{dayLabel}：{currentWeight} kg</span>
              {getTrendIcon()}
              {targetWeight && (
                <span className="ml-auto">目標：{targetWeight} kg</span>
              )}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            label="目前體重"
            value={currentWeight ? `${currentWeight}` : latestWeight ? `${latestWeight}` : "--"}
            unit="kg"
          />
          <SummaryCard
            label="目標體重"
            value={targetWeight ? `${targetWeight}` : "--"}
            unit="kg"
          />
          <SummaryCard
            label="近 7 天變化"
            value={weekChange !== null ? `${weekChange > 0 ? "+" : ""}${weekChange}` : "--"}
            unit="kg"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

        {/* Trend Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
              體重趨勢
            </p>
            <div className="flex gap-1.5">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => setSelectedRange(r.days)}
                  className={`px-2.5 py-1 text-[10px] font-light rounded border transition-all duration-300 ${
                    selectedRange === r.days
                      ? "border-foreground/20 bg-foreground/5"
                      : "border-black/[0.06] dark:border-white/[0.06] hover:border-foreground/20"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {weightData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.3} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.3} width={40} />
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
                  dataKey="value"
                  stroke="var(--color-primary)"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                  name="體重 (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm font-light text-neutral-300 dark:text-neutral-700 text-center py-8">
              需要至少 2 筆體重記錄才能顯示趨勢
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WeightPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6"><p className="text-center text-neutral-400 font-light">載入中...</p></div>}>
      <WeightContent />
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
