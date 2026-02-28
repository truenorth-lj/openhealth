"use client";

import { Progress } from "@/components/ui/progress";

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
}: DailySummaryProps) {
  const remaining = calorieTarget - calories;

  return (
    <div className="mx-4 rounded-xl bg-card border p-4 space-y-4">
      {/* Calorie Summary */}
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-2xl font-bold">{Math.round(calories)}</p>
          <p className="text-xs text-muted-foreground">已攝取</p>
        </div>
        <div className="text-center">
          <p
            className={`text-2xl font-bold ${
              remaining >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {Math.round(remaining)}
          </p>
          <p className="text-xs text-muted-foreground">剩餘</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-muted-foreground">
            {calorieTarget}
          </p>
          <p className="text-xs text-muted-foreground">目標</p>
        </div>
      </div>

      <Progress value={calories} max={calorieTarget} />

      {/* Macro Summary */}
      <div className="grid grid-cols-4 gap-2">
        <MacroBar
          label="蛋白質"
          current={protein}
          target={proteinTarget}
          color="bg-blue-500"
        />
        <MacroBar
          label="碳水"
          current={carbs}
          target={carbsTarget}
          color="bg-amber-500"
        />
        <MacroBar
          label="脂肪"
          current={fat}
          target={fatTarget}
          color="bg-rose-500"
        />
        <MacroBar
          label="纖維"
          current={fiber}
          target={fiberTarget}
          color="bg-emerald-500"
        />
      </div>
    </div>
  );
}

function MacroBar({
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
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current.toFixed(0)}/{target}g
        </span>
      </div>
      <Progress
        value={current}
        max={target}
        indicatorClassName={color}
      />
    </div>
  );
}
