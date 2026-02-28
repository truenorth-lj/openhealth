"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold">水分追蹤</h1>

      <Card>
        <CardContent className="flex flex-col items-center py-8">
          {/* Circular progress visual */}
          <div className="relative flex h-40 w-40 items-center justify-center">
            <svg className="h-40 w-40 -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${percentage * 4.4} ${440 - percentage * 4.4}`}
                strokeLinecap="round"
                className="text-blue-500 transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <Droplets className="h-6 w-6 text-blue-500 mb-1" />
              <span className="text-2xl font-bold">{todayTotal}</span>
              <span className="text-xs text-muted-foreground">/ {dailyTarget} ml</span>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {percentage >= 100
              ? "已達到今日目標！"
              : `還需 ${dailyTarget - todayTotal} ml`}
          </p>
        </CardContent>
      </Card>

      {/* Quick Add Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">快速新增</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((ml) => (
              <Button
                key={ml}
                variant="outline"
                onClick={() => addWater(ml)}
                className="flex flex-col h-16 text-xs"
              >
                <Plus className="h-3 w-3 mb-1" />
                {ml} ml
              </Button>
            ))}
          </div>
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addWater(-250)}
              className="text-muted-foreground"
            >
              <Minus className="h-3 w-3 mr-1" />
              減少 250ml
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
