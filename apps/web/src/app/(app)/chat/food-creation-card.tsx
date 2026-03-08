"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Loader2, UtensilsCrossed, AlertCircle } from "lucide-react";
import { logFood } from "@/server/actions/diary";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "點心",
};

interface CreateFoodOutput {
  foodId: string;
  foodName: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  servingSize: number;
  servingUnit: string;
  mealType: string;
  date: string;
  error?: never;
}

interface CreateFoodError {
  error: string;
  foodId?: never;
}

type CreateFoodResult = CreateFoodOutput | CreateFoodError;

interface FoodCreationCardProps {
  part: {
    toolName: string;
    toolCallId: string;
    state: string;
    input?: { description?: string; mealType?: string; date?: string };
    output?: CreateFoodResult;
  };
}

export function FoodCreationCard({ part }: FoodCreationCardProps) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Loading state
  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="my-2 w-full max-w-[85%] rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          正在估算「{part.input?.description ?? "食物"}」的營養...
        </div>
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"
              style={{ width: `${70 - i * 15}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (part.state === "output-error" || (part.output && "error" in part.output)) {
    const errorText =
      part.state === "output-error"
        ? "估算失敗，請重試"
        : (part.output as CreateFoodError)?.error ?? "未知錯誤";
    return (
      <div className="my-2 w-full max-w-[85%] rounded-xl border border-destructive/20 p-4">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
          {errorText}
        </div>
      </div>
    );
  }

  // Output available
  if (part.state !== "output-available" || !part.output || "error" in part.output) {
    return null;
  }

  const output = part.output as CreateFoodOutput;

  const handleConfirm = () => {
    startTransition(async () => {
      await logFood({
        date: output.date,
        mealType: output.mealType as "breakfast" | "lunch" | "dinner" | "snack",
        foodId: output.foodId,
        servingQty: 1,
      });
      setConfirmed(true);
    });
  };

  const handleEdit = () => {
    const params = new URLSearchParams({
      name: output.foodName,
      calories: String(output.calories),
      protein: String(output.proteinG),
      fat: String(output.fatG),
      carbs: String(output.carbsG),
      fiber: String(output.fiberG),
      servingSize: String(output.servingSize),
      servingUnit: output.servingUnit,
      fromChat: "1",
    });
    router.push(`/food/create?${params.toString()}`);
  };

  // Confirmed state
  if (confirmed) {
    return (
      <div className="my-2 w-full max-w-[85%] rounded-xl border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/20 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
          <div>
            <span className="text-sm font-medium">{output.foodName}</span>
            <span className="ml-2 text-xs text-neutral-400">
              已加入{MEAL_LABELS[output.mealType] ?? "日記"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Result card
  return (
    <div className="my-2 w-full max-w-[85%] rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.06] px-4 py-3">
        <UtensilsCrossed className="h-4 w-4 text-green-600" strokeWidth={1.5} />
        <span className="text-sm font-medium">{output.foodName}</span>
        <span className="ml-auto rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">
          {MEAL_LABELS[output.mealType] ?? output.mealType}
        </span>
      </div>

      {/* Nutrition */}
      <div className="grid grid-cols-4 gap-3 px-4 py-3">
        <NutrientCell label="熱量" value={output.calories} unit="kcal" color="text-green-600" />
        <NutrientCell label="蛋白質" value={output.proteinG} unit="g" color="text-blue-600" />
        <NutrientCell label="碳水" value={output.carbsG} unit="g" color="text-amber-600" />
        <NutrientCell label="脂肪" value={output.fatG} unit="g" color="text-rose-500" />
      </div>

      <div className="px-4 pb-1 text-xs text-neutral-400">
        {output.servingSize}{output.servingUnit}
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3">
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          ) : (
            <Check className="h-4 w-4" strokeWidth={1.5} />
          )}
          加入日記
        </button>
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 rounded-lg border border-black/[0.06] dark:border-white/[0.06] px-3 py-2 text-sm font-light transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
          編輯
        </button>
      </div>
    </div>
  );
}

function NutrientCell({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-base font-medium ${color}`}>
        {Math.round(value)}
      </div>
      <div className="text-[10px] text-neutral-400">
        {label} ({unit})
      </div>
    </div>
  );
}
