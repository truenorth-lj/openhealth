"use client";

import { Suspense, useState, useCallback, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc-client";
import { logSteps } from "@/server/actions/progress";
import { format, parseISO, isValid, isToday } from "date-fns";
import { DateNavigator } from "@/components/diary/date-navigator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Footprints } from "lucide-react";
import {
  BarChart,
  Bar,
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

function StepsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = parseDateParam(searchParams.get("date"));
  const dateStr = format(date, "yyyy-MM-dd");

  const [steps, setSteps] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedRange, setSelectedRange] = useState(30);

  const utils = trpc.useUtils();

  const { data: dateSteps, isLoading } = trpc.progress.getDateSteps.useQuery({ date: dateStr });
  const { data: stepsHistory } = trpc.progress.getStepsHistory.useQuery({ limit: 7 });
  const { data: analytics } = trpc.progress.getAnalytics.useQuery({ days: selectedRange });

  const currentSteps = dateSteps ? Number(dateSteps.steps) : null;

  useEffect(() => {
    setSteps(currentSteps !== null ? String(currentSteps) : "");
  }, [currentSteps, dateStr]);

  const handleDateChange = useCallback(
    (newDate: Date) => {
      const newDateStr = format(newDate, "yyyy-MM-dd");
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const url = newDateStr === todayStr ? "/hub/steps" : `/hub/steps?date=${newDateStr}`;
      router.replace(url);
    },
    [router]
  );

  const handleLogSteps = () => {
    const stepsNum = parseInt(steps, 10);
    if (!steps || isNaN(stepsNum)) return;
    startTransition(async () => {
      await logSteps({ date: dateStr, steps: stepsNum });
      await utils.progress.invalidate();
    });
  };

  const dayLabel = isToday(date) ? "今日" : format(date, "M/d");

  const stepsData =
    analytics?.steps.map((s) => ({
      date: format(new Date(s.date), "M/d"),
      value: s.value,
    })) ?? [];

  const recentStepsAvg =
    stepsHistory && stepsHistory.length > 0
      ? Math.round(
          stepsHistory.reduce((sum, s) => sum + Number(s.steps), 0) / stepsHistory.length
        )
      : null;

  const maxSteps =
    stepsHistory && stepsHistory.length > 0
      ? Math.max(...stepsHistory.map((s) => Number(s.steps)))
      : null;

  const totalSteps =
    stepsHistory && stepsHistory.length > 0
      ? stepsHistory.reduce((sum, s) => sum + Number(s.steps), 0)
      : null;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <DateNavigator date={date} onDateChange={handleDateChange} />

      <div className="px-4 space-y-6">
        <div className="flex items-center gap-2">
          <Footprints className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />
          <h1 className="text-xl font-light tracking-wide">步數紀錄</h1>
        </div>

        {/* Input */}
        <div className="space-y-3">
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
              disabled={!steps || isPending}
              className="px-6 py-2 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20 disabled:opacity-30"
            >
              {isPending ? "..." : currentSteps !== null ? "更新" : "記錄"}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm font-light text-neutral-500">
            {currentSteps !== null ? (
              <span>{dayLabel}：{currentSteps.toLocaleString()} 步</span>
            ) : (
              <span>{dayLabel} 尚無記錄</span>
            )}
            {recentStepsAvg !== null && (
              <span className="ml-auto">
                近 {stepsHistory!.length} 天平均：{recentStepsAvg.toLocaleString()} 步
              </span>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            label={`${dayLabel}步數`}
            value={currentSteps !== null ? currentSteps.toLocaleString() : "--"}
            unit="步"
          />
          <SummaryCard
            label="7 天平均"
            value={recentStepsAvg !== null ? recentStepsAvg.toLocaleString() : "--"}
            unit="步"
          />
          <SummaryCard
            label="7 天最高"
            value={maxSteps !== null ? maxSteps.toLocaleString() : "--"}
            unit="步"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

        {/* Trend Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
              步數趨勢
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
          {stepsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stepsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.3} />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.3} width={50} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "4px",
                    border: "1px solid rgba(0,0,0,0.06)",
                    fontSize: "12px",
                    fontWeight: 300,
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-primary)"
                  opacity={0.7}
                  radius={[2, 2, 0, 0]}
                  name="步數"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm font-light text-neutral-300 dark:text-neutral-700 text-center py-8">
              尚無步數記錄
            </p>
          )}
        </div>

        {/* 7-day total */}
        {totalSteps !== null && (
          <>
            <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />
            <div className="text-center text-sm font-light text-neutral-500">
              近 7 天累計：{totalSteps.toLocaleString()} 步
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StepsPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6"><p className="text-center text-neutral-400 font-light">載入中...</p></div>}>
      <StepsContent />
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
