"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";

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
    if (!weightHistory || weightHistory.length < 2) return <Minus className="h-4 w-4" />;
    const latest = Number(weightHistory[weightHistory.length - 1].weightKg);
    const previous = Number(weightHistory[weightHistory.length - 2].weightKg);
    if (latest < previous) return <TrendingDown className="h-4 w-4 text-primary" />;
    if (latest > previous) return <TrendingUp className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold">進度追蹤</h1>

      {/* Weight Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4" />
            記錄體重
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="體重 (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleLogWeight}
              disabled={!weight || isPending}
            >
              {isPending ? "..." : "記錄"}
            </Button>
          </div>
          {currentWeight && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <span>目前：{currentWeight} kg</span>
              {getTrendIcon()}
              {targetWeight && (
                <span className="ml-auto">
                  目標：{targetWeight} kg
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">體重趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(142.1 76.2% 36.3%)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="體重 (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Macro Weekly Summary placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">本週營養摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            開始記錄食物後即可查看營養摘要
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
