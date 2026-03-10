"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCustomFood } from "@/server/actions/food";
import { logFood } from "@/server/actions/diary";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { NUTRIENT_IDS, NUTRIENT_NAME_ZH, MACRO_NUTRIENT_IDS, DEFAULT_SERVING_SIZE } from "@open-health/shared/constants";
import posthog from "posthog-js";
import { useTranslation } from "react-i18next";

const MACRO_IDS = new Set(MACRO_NUTRIENT_IDS);

function CreateFoodContent() {
  const { t } = useTranslation(["food", "common"]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const meal = (searchParams.get("meal") || "snack") as "breakfast" | "lunch" | "dinner" | "snack";
  const defaultName = searchParams.get("name") || "";

  const [isPending, startTransition] = useTransition();
  const utils = trpc.useUtils();
  const [name, setName] = useState(defaultName);
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState(String(DEFAULT_SERVING_SIZE));
  const [servingUnit, setServingUnit] = useState("g");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [microExpanded, setMicroExpanded] = useState(false);
  const [microValues, setMicroValues] = useState<Record<number, string>>({});

  const { data: nutrientDefs } = trpc.user.getNutrientDefinitions.useQuery(
    undefined,
    { enabled: microExpanded }
  );
  const microNutrients = nutrientDefs?.filter((n) => !MACRO_IDS.has(n.id)) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const allNutrients = [
            { nutrientId: NUTRIENT_IDS.protein, amount: parseFloat(protein) || 0 },
            { nutrientId: NUTRIENT_IDS.totalFat, amount: parseFloat(fat) || 0 },
            { nutrientId: NUTRIENT_IDS.totalCarbs, amount: parseFloat(carbs) || 0 },
            ...Object.entries(microValues)
              .filter(([, v]) => v && parseFloat(v) > 0)
              .map(([id, v]) => ({ nutrientId: Number(id), amount: parseFloat(v) })),
          ];

        const result = await createCustomFood({
          name,
          brand: brand || undefined,
          servingSize: parseFloat(servingSize),
          servingUnit,
          calories: parseFloat(calories),
          nutrients: allNutrients,
        });

        if (result.success && result.foodId) {
          await logFood({
            date,
            mealType: meal,
            foodId: result.foodId,
            servingQty: 1,
          });
          await utils.diary.getDay.invalidate();
          posthog.capture("food_logged", { source: "create", meal_type: meal, calories: parseFloat(calories) });
          toast.success(t("common:toast.addedToDiary"));
          router.push(`/hub/diary?date=${date}`);
          router.refresh();
        } else {
          toast.error(t("common:toast.createFoodFailed"));
        }
      } catch (err) {
        console.error("createCustomFood/logFood failed:", err);
        toast.error(t("common:toast.addFailed"));
      }
    });
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/hub/food/search?date=${date}&meal=${meal}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold">{t("food:customFood")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("common:labels.basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("food:foodName")} *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("food:foodNamePlaceholder")}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("food:brand")}</label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder={t("common:labels.optional")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("food:servingSizeLabel")} *</label>
                <Input
                  type="number"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("food:unitLabel")} *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={servingUnit}
                  onChange={(e) => setServingUnit(e.target.value)}
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="oz">oz</option>
                  <option value="cup">cup</option>
                  <option value="piece">{t("common:units.pieces")}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("common:labels.nutritionInfoPerServing")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("food:caloriesKcal")} *</label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-blue-500">{t("common:macro.protein")} (g)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-amber-500">{t("common:macro.carbs")} (g)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-rose-500">{t("common:macro.fat")} (g)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collapsible Micro Nutrients */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setMicroExpanded(!microExpanded)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("food:deepNutrients")}</CardTitle>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  microExpanded ? "rotate-180" : ""
                }`}
                strokeWidth={1.5}
              />
            </div>
            <p className="text-xs text-muted-foreground font-light">
              {t("food:deepNutrientsHint")}
            </p>
          </CardHeader>
          {microExpanded && (
            <CardContent className="space-y-3">
              {microNutrients.map((n) => {
                const label = NUTRIENT_NAME_ZH[n.name] || n.name;
                return (
                  <div key={n.id} className="flex items-center gap-3">
                    <label className="text-sm font-light w-28 shrink-0 truncate">
                      {label}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={microValues[n.id] || ""}
                      onChange={(e) =>
                        setMicroValues((prev) => ({ ...prev, [n.id]: e.target.value }))
                      }
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-8 shrink-0">
                      {n.unit}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common:buttons.creating") : t("food:createAndAdd")}
        </Button>
      </form>
    </div>
  );
}

export default function CreateFoodPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-4 space-y-4">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </div>
      }
    >
      <CreateFoodContent />
    </Suspense>
  );
}
