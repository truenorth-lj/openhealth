"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { estimateNutritionFromText } from "@/server/actions/food-estimation";
import { createCustomFood } from "@/server/actions/food";
import { logFood } from "@/server/actions/diary";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { NUTRIENT_IDS } from "@open-health/shared/constants";

const EXAMPLES = [
  "一碗白飯",
  "滷雞腿便當",
  "一碗涼麵，大概 400g",
  "珍珠奶茶 大杯 700ml",
  "水煎包 3 個",
];

function EstimateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const meal = (searchParams.get("meal") || "snack") as
    | "breakfast"
    | "lunch"
    | "dinner"
    | "snack";

  const [stage, setStage] = useState<"input" | "estimating" | "edit">("input");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const utils = trpc.useUtils();

  // Form fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState("100");
  const [servingUnit, setServingUnit] = useState("g");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [sodium, setSodium] = useState("");
  const [sugar, setSugar] = useState("");
  const [fiber, setFiber] = useState("");
  const [saturatedFat, setSaturatedFat] = useState("");
  const [transFat, setTransFat] = useState("");
  const [cholesterol, setCholesterol] = useState("");

  const handleEstimate = async () => {
    if (!description.trim()) return;

    setError(null);
    setIsEstimating(true);
    setStage("estimating");

    try {
      const result = await estimateNutritionFromText(description);

      if (result.success) {
        const data = result.data;
        setName(data.foodName || "");
        setBrand(data.brand || "");
        setServingSize(String(data.servingSize || 100));
        setServingUnit(data.servingUnit || "g");
        setCalories(String(data.calories || 0));
        setProtein(String(data.proteinG || 0));
        setCarbs(String(data.carbsG || 0));
        setFat(String(data.fatG || 0));
        setSodium(data.sodiumMg != null ? String(data.sodiumMg) : "");
        setSugar(data.sugarG != null ? String(data.sugarG) : "");
        setFiber(data.fiberG != null ? String(data.fiberG) : "");
        setSaturatedFat(
          data.saturatedFatG != null ? String(data.saturatedFatG) : ""
        );
        setTransFat(data.transFatG != null ? String(data.transFatG) : "");
        setCholesterol(
          data.cholesterolMg != null ? String(data.cholesterolMg) : ""
        );
        setStage("edit");
      } else {
        setError(result.error || "估算失敗");
        setStage("input");
      }
    } catch {
      setError("估算過程發生錯誤，請重試");
      setStage("input");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleReset = () => {
    setStage("input");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const nutrients: { nutrientId: number; amount: number }[] = [
          {
            nutrientId: NUTRIENT_IDS.protein,
            amount: parseFloat(protein) || 0,
          },
          {
            nutrientId: NUTRIENT_IDS.totalFat,
            amount: parseFloat(fat) || 0,
          },
          {
            nutrientId: NUTRIENT_IDS.totalCarbs,
            amount: parseFloat(carbs) || 0,
          },
        ];

        if (fiber)
          nutrients.push({
            nutrientId: NUTRIENT_IDS.fiber,
            amount: parseFloat(fiber),
          });
        if (sugar)
          nutrients.push({
            nutrientId: NUTRIENT_IDS.sugar,
            amount: parseFloat(sugar),
          });
        if (saturatedFat)
          nutrients.push({
            nutrientId: NUTRIENT_IDS.saturatedFat,
            amount: parseFloat(saturatedFat),
          });
        if (transFat)
          nutrients.push({
            nutrientId: NUTRIENT_IDS.transFat,
            amount: parseFloat(transFat),
          });
        if (cholesterol)
          nutrients.push({
            nutrientId: NUTRIENT_IDS.cholesterol,
            amount: parseFloat(cholesterol),
          });
        if (sodium)
          nutrients.push({
            nutrientId: NUTRIENT_IDS.sodium,
            amount: parseFloat(sodium),
          });

        const result = await createCustomFood({
          name,
          brand: brand || undefined,
          servingSize: parseFloat(servingSize),
          servingUnit,
          calories: parseFloat(calories),
          nutrients,
        });

        if (result.success && result.foodId) {
          await logFood({
            date,
            mealType: meal,
            foodId: result.foodId,
            servingQty: 1,
          });
          await utils.diary.getDay.invalidate();
          toast.success("已新增到日記");
          router.push(`/diary?date=${date}`);
          router.refresh();
        } else {
          toast.error("建立食物失敗，請重試");
        }
      } catch (err) {
        console.error("createCustomFood/logFood failed:", err);
        toast.error("新增失敗，請重試");
      }
    });
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/food/search?date=${date}&meal=${meal}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold">AI 估算營養</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stage 1: Input */}
      {stage === "input" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>描述你吃了什麼，AI 會估算營養成分</span>
              </div>
              <Textarea
                placeholder="例如：一碗涼麵，大概 400g"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
                autoFocus
              />
              <Button
                onClick={handleEstimate}
                className="w-full"
                disabled={!description.trim() || isEstimating}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                AI 估算
              </Button>
            </CardContent>
          </Card>

          <div>
            <p className="text-xs text-muted-foreground mb-2 px-1">
              試試這些範例
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  onClick={() => setDescription(example)}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stage 2: Estimating */}
      {stage === "estimating" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">AI 估算中...</p>
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 max-w-xs text-center">
                  &ldquo;{description}&rdquo;
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stage 3: Edit & Confirm */}
      {stage === "edit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 max-w-[70%]">
              &ldquo;{description}&rdquo;
            </p>
            <Button variant="outline" size="sm" onClick={handleReset}>
              重新描述
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">食物名稱 *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例：雞排"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">品牌</label>
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="選填"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">份量大小 *</label>
                    <Input
                      type="number"
                      value={servingSize}
                      onChange={(e) => setServingSize(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">單位 *</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={servingUnit}
                      onChange={(e) => setServingUnit(e.target.value)}
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="oz">oz</option>
                      <option value="cup">cup</option>
                      <option value="piece">個</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">營養資訊 (每份)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">熱量 (kcal) *</label>
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
                    <label className="text-xs font-medium text-blue-500">
                      蛋白質 (g)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-amber-500">
                      碳水 (g)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-rose-500">
                      脂肪 (g)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    其他營養素
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">
                        飽和脂肪 (g)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={saturatedFat}
                        onChange={(e) => setSaturatedFat(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">
                        反式脂肪 (g)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={transFat}
                        onChange={(e) => setTransFat(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">糖 (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={sugar}
                        onChange={(e) => setSugar(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">
                        膳食纖維 (g)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={fiber}
                        onChange={(e) => setFiber(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">鈉 (mg)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={sodium}
                        onChange={(e) => setSodium(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">
                        膽固醇 (mg)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={cholesterol}
                        onChange={(e) => setCholesterol(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "建立中..." : "確認並新增到日記"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function EstimatePage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-4 space-y-4">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      }
    >
      <EstimateContent />
    </Suspense>
  );
}
