"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { DEFAULT_WATER_GOAL_ML } from "@open-health/shared/constants";

const RANGES = [
  { label: "7 天", days: 7 },
  { label: "30 天", days: 30 },
  { label: "90 天", days: 90 },
] as const;

export default function AnalysisPage() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState(30);

  const { data, isLoading } = trpc.progress.getAnalytics.useQuery({
    days: selectedRange,
  });

  const weightData =
    data?.weight.map((w) => ({
      date: format(new Date(w.date), "M/d"),
      value: w.value,
    })) ?? [];

  const stepsData =
    data?.steps.map((s) => ({
      date: format(new Date(s.date), "M/d"),
      value: s.value,
    })) ?? [];

  const waterData =
    data?.water.map((w) => ({
      date: format(new Date(w.date), "M/d"),
      value: w.value,
    })) ?? [];

  const waterGoalMl = data?.waterGoalMl ?? DEFAULT_WATER_GOAL_ML;

  const stepsAvg =
    stepsData.length > 0
      ? Math.round(stepsData.reduce((s, d) => s + d.value, 0) / stepsData.length)
      : null;

  const waterAvg =
    waterData.length > 0
      ? Math.round(waterData.reduce((s, d) => s + d.value, 0) / waterData.length)
      : null;

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <h1 className="text-xl font-light tracking-wide">趨勢分析</h1>
      </div>

      {/* Range Selector */}
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setSelectedRange(r.days)}
            className={`px-4 py-1.5 text-sm font-light rounded-md border transition-all duration-300 ${
              selectedRange === r.days
                ? "border-foreground/20 bg-foreground/5"
                : "border-black/[0.06] dark:border-white/[0.06] hover:border-foreground/20"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Weight Chart */}
          <ChartSection title="體重趨勢" subtitle="kg">
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
              <EmptyState text="需要至少 2 筆體重記錄" />
            )}
          </ChartSection>

          {/* Steps Chart */}
          <ChartSection
            title="步數趨勢"
            subtitle={stepsAvg ? `平均 ${stepsAvg.toLocaleString()} 步/天` : "步"}
          >
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
              <EmptyState text="尚無步數記錄" />
            )}
          </ChartSection>

          {/* Water Chart */}
          <ChartSection
            title="飲水趨勢"
            subtitle={waterAvg ? `平均 ${waterAvg.toLocaleString()} ml/天` : "ml"}
          >
            {waterData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={waterData}>
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
                    fill="#3b82f6"
                    opacity={0.7}
                    radius={[2, 2, 0, 0]}
                    name="飲水 (ml)"
                  />
                  {/* Goal reference line */}
                  <Line
                    type="monotone"
                    dataKey={() => waterGoalMl}
                    stroke="#93c5fd"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                    name={`目標 ${waterGoalMl} ml`}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="尚無飲水記錄" />
            )}
          </ChartSection>
        </>
      )}
    </div>
  );
}

function ChartSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          {title}
        </p>
        <span className="text-[10px] font-light text-neutral-300 dark:text-neutral-700">
          {subtitle}
        </span>
      </div>
      {children}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-sm font-light text-neutral-300 dark:text-neutral-700 text-center py-8">
      {text}
    </p>
  );
}
