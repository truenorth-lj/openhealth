"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { NUTRIENT_IDS } from "@open-health/shared/constants";

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
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [validationError, setValidationError] = useState<string>();

  const utils = trpc.useUtils();
  const { data: food, isLoading } = trpc.food.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id }
  );

  const updateMutation = trpc.food.updateFood.useMutation({
    onSuccess: () => {
      utils.food.getById.invalidate({ id: params.id });
      setIsEditing(false);
    },
  });

  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    description: "",
    servingSize: "",
    servingUnit: "",
    householdServing: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
  });

  const isOwner = !!(session?.user?.id && food?.createdBy && session.user.id === food.createdBy);

  function startEditing() {
    if (!food) return;
    const findNut = (name: string) =>
      food.nutrients.find((n) => n.name.toLowerCase().includes(name))?.amount ?? "0";
    setEditForm({
      name: food.name,
      brand: food.brand ?? "",
      description: food.description ?? "",
      servingSize: String(food.servingSize),
      servingUnit: food.servingUnit,
      householdServing: food.householdServing ?? "",
      calories: String(food.calories),
      protein: findNut("protein"),
      carbs: findNut("carbohydrate"),
      fat: findNut("fat") !== "0" ? findNut("fat") : findNut("lipid"),
      fiber: findNut("fiber"),
    });
    setValidationError(undefined);
    setIsEditing(true);
  }

  function handleSave() {
    if (!food) return;
    const servingSize = Number(editForm.servingSize);
    const calories = Number(editForm.calories);
    if (isNaN(servingSize) || servingSize <= 0 || isNaN(calories) || calories < 0) {
      setValidationError("請輸入有效的數值");
      return;
    }
    setValidationError(undefined);
    const protein = Number(editForm.protein) || 0;
    const carbs = Number(editForm.carbs) || 0;
    const fat = Number(editForm.fat) || 0;
    const fiber = Number(editForm.fiber) || 0;
    const nutrients = [
      { nutrientId: NUTRIENT_IDS.protein, amount: protein },
      { nutrientId: NUTRIENT_IDS.totalCarbs, amount: carbs },
      { nutrientId: NUTRIENT_IDS.totalFat, amount: fat },
      { nutrientId: NUTRIENT_IDS.fiber, amount: fiber },
    ];
    updateMutation.mutate({
      id: food.id,
      name: editForm.name,
      brand: editForm.brand || null,
      description: editForm.description || null,
      servingSize,
      servingUnit: editForm.servingUnit,
      householdServing: editForm.householdServing || null,
      calories,
      nutrients,
    });
  }

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
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="font-semibold"
            />
          ) : (
            <>
              <h1 className="font-semibold truncate">{food.name}</h1>
              {food.brand && (
                <p className="text-xs text-muted-foreground">{food.brand}</p>
              )}
            </>
          )}
        </div>
        {isOwner && !isEditing && (
          <Button variant="ghost" size="icon" onClick={startEditing}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(false)}
              disabled={updateMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Brand (edit mode) */}
      {isEditing && (
        <div className="mb-3 space-y-2">
          <Input
            value={editForm.brand}
            onChange={(e) => setEditForm((f) => ({ ...f, brand: e.target.value }))}
            placeholder="品牌（選填）"
          />
        </div>
      )}

      {/* Description */}
      {isEditing ? (
        <div className="mb-4">
          <Textarea
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="備註（選填）"
            rows={3}
          />
        </div>
      ) : (
        food.description && (
          <p className="text-sm text-muted-foreground mb-4 px-1 whitespace-pre-wrap">{food.description}</p>
        )
      )}

      {/* Serving info */}
      {isEditing ? (
        <div className="rounded-lg bg-muted/50 px-4 py-3 mb-4 space-y-2">
          <p className="text-sm text-muted-foreground">每份</p>
          <div className="flex gap-2">
            <Input
              type="number"
              value={editForm.servingSize}
              onChange={(e) => setEditForm((f) => ({ ...f, servingSize: e.target.value }))}
              placeholder="份量"
              className="w-24"
            />
            <Input
              value={editForm.servingUnit}
              onChange={(e) => setEditForm((f) => ({ ...f, servingUnit: e.target.value }))}
              placeholder="單位"
              className="w-20"
            />
            <Input
              value={editForm.householdServing}
              onChange={(e) => setEditForm((f) => ({ ...f, householdServing: e.target.value }))}
              placeholder="家用份量（選填）"
              className="flex-1"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-muted/50 px-4 py-3 mb-4">
          <p className="text-sm text-muted-foreground">每份</p>
          <p className="text-lg font-semibold">
            {food.servingSize}{food.servingUnit}
            {food.householdServing ? ` (${food.householdServing})` : ""}
          </p>
        </div>
      )}

      {/* Calories + Macros summary */}
      <div className="rounded-lg border p-4 mb-4">
        <div className="text-center mb-3">
          {isEditing ? (
            <div className="flex items-center justify-center gap-2">
              <Input
                type="number"
                value={editForm.calories}
                onChange={(e) => setEditForm((f) => ({ ...f, calories: e.target.value }))}
                className="w-28 text-center text-xl font-bold"
              />
              <span className="text-sm text-muted-foreground">大卡</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold">{Math.round(Number(food.calories ?? 0))}</p>
              <p className="text-sm text-muted-foreground">大卡</p>
            </>
          )}
        </div>
        {isEditing ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            <EditableMacro label="蛋白質" value={editForm.protein} onChange={(v) => setEditForm((f) => ({ ...f, protein: v }))} />
            <EditableMacro label="碳水" value={editForm.carbs} onChange={(v) => setEditForm((f) => ({ ...f, carbs: v }))} />
            <EditableMacro label="脂肪" value={editForm.fat} onChange={(v) => setEditForm((f) => ({ ...f, fat: v }))} />
            <EditableMacro label="纖維" value={editForm.fiber} onChange={(v) => setEditForm((f) => ({ ...f, fiber: v }))} />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            <MacroItem label="蛋白質" value={proteinG} unit="g" />
            <MacroItem label="碳水" value={carbsG} unit="g" />
            <MacroItem label="脂肪" value={fatG} unit="g" />
            <MacroItem label="纖維" value={fiberG} unit="g" />
          </div>
        )}
      </div>

      {/* Errors */}
      {validationError && (
        <p className="text-sm text-red-500 mb-4">{validationError}</p>
      )}
      {updateMutation.isError && (
        <p className="text-sm text-red-500 mb-4">
          {updateMutation.error.message}
        </p>
      )}

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

function EditableMacro({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-center gap-0.5">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 text-center text-lg font-semibold px-1 h-8"
        />
        <span className="text-sm font-semibold">g</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function formatAmount(amount: number): string {
  if (amount === 0) return "0";
  if (amount >= 1) return amount.toFixed(1).replace(/\.0$/, "");
  return amount.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
