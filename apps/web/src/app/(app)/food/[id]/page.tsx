"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc-client";

const categoryLabels: Record<string, string> = {
  macro: "巨量營養素",
  vitamin: "維生素",
  mineral: "礦物質",
  other: "其他",
};

const categoryOrder = ["macro", "vitamin", "mineral", "other"];

export default function FoodDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data: food, isLoading } = trpc.food.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id }
  );

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-3">
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!food) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">找不到食物</h1>
        </div>
      </div>
    );
  }

  const findNutrient = (name: string) =>
    food.nutrients.find((n) => n.name.toLowerCase().includes(name));

  const proteinG = findNutrient("protein")?.amount ?? "0";
  const carbsG = findNutrient("carbohydrate")?.amount ?? "0";
  const fatG = findNutrient("fat")?.amount ?? findNutrient("lipid")?.amount ?? "0";
  const fiberG = findNutrient("fiber")?.amount ?? "0";

  const nutrientsByCategory = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      nutrients: food.nutrients.filter((n) => n.category === cat),
    }))
    .filter((group) => group.nutrients.length > 0);

  return (
    <div className="px-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="font-semibold truncate">{food.name}</h1>
          {food.brand && (
            <p className="text-xs text-muted-foreground">{food.brand}</p>
          )}
        </div>
      </div>

      {/* Serving info */}
      <div className="rounded-lg bg-muted/50 px-4 py-3 mb-4">
        <p className="text-sm text-muted-foreground">每份</p>
        <p className="text-lg font-semibold">
          {food.servingSize}{food.servingUnit}
          {food.householdServing ? ` (${food.householdServing})` : ""}
        </p>
      </div>

      {/* Calories + Macros summary */}
      <div className="rounded-lg border p-4 mb-4">
        <div className="text-center mb-3">
          <p className="text-3xl font-bold">{Math.round(Number(food.calories ?? 0))}</p>
          <p className="text-sm text-muted-foreground">大卡</p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <MacroItem label="蛋白質" value={proteinG} unit="g" />
          <MacroItem label="碳水" value={carbsG} unit="g" />
          <MacroItem label="脂肪" value={fatG} unit="g" />
          <MacroItem label="纖維" value={fiberG} unit="g" />
        </div>
      </div>

      {/* Full nutrient list by category */}
      {nutrientsByCategory.map((group) => (
        <div key={group.category} className="mb-4">
          <h2 className="text-sm font-semibold mb-2 px-1">{group.label}</h2>
          <div className="rounded-lg border divide-y">
            {group.nutrients.map((nutrient, idx) => {
              const amount = Number(nutrient.amount ?? 0);
              const dv = nutrient.dailyValue ? Number(nutrient.dailyValue) : null;
              const dvPercent = dv && dv > 0 ? Math.round((amount / dv) * 100) : null;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <span className="text-sm">{nutrient.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums">
                      {formatAmount(amount)} {nutrient.unit}
                    </span>
                    {dvPercent !== null && (
                      <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">
                        {dvPercent}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MacroItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | null;
  unit: string;
}) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums">
        {Math.round(Number(value ?? 0))}{unit}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function formatAmount(amount: number): string {
  if (amount === 0) return "0";
  if (amount >= 1) return amount.toFixed(1).replace(/\.0$/, "");
  return amount.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
