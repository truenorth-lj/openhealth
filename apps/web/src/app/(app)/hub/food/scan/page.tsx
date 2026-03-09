"use client";

import { Suspense, useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Loader2, Keyboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lookupOpenFoodFacts, createFoodFromBarcode } from "@/server/actions/barcode";
import { logFood } from "@/server/actions/diary";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import posthog from "posthog-js";

type Stage = "scanning" | "searching" | "edit" | "not_found";

function ScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const meal = (searchParams.get("meal") || "snack") as
    | "breakfast"
    | "lunch"
    | "dinner"
    | "snack";

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);
  const [stage, setStage] = useState<Stage>("scanning");
  const [barcode, setBarcode] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [existingFoodId, setExistingFoodId] = useState<string | null>(null);
  const [offImageUrl, setOffImageUrl] = useState<string | undefined>();
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

  const stopScanner = useCallback(async () => {
    try {
      const scanner = html5QrRef.current as { stop?: () => Promise<void>; clear?: () => void } | null;
      if (scanner) {
        if (scanner.stop) await scanner.stop();
        if (scanner.clear) scanner.clear();
      }
    } catch {
      // Scanner may already be stopped
    }
    html5QrRef.current = null;
  }, []);

  const handleBarcodeLookup = useCallback(
    async (code: string) => {
      setBarcode(code);
      setStage("searching");
      setError(null);
      await stopScanner();

      try {
        // 1. Check local DB first
        const localFood = await utils.food.getByBarcode.fetch({ barcode: code });
        if (localFood) {
          setExistingFoodId(localFood.id);
          setName(localFood.name);
          setBrand(localFood.brand || "");
          setServingSize(String(localFood.servingSize));
          setServingUnit(localFood.servingUnit);
          setCalories(String(localFood.calories));

          // Extract macros from nutrients
          const nutrientMap: Record<string, string> = {};
          if (localFood.nutrients) {
            for (const n of localFood.nutrients) {
              nutrientMap[n.name] = n.amount;
            }
          }
          setProtein(nutrientMap["Protein"] || "0");
          setFat(nutrientMap["Total Fat"] || "0");
          setCarbs(nutrientMap["Total Carbohydrate"] || "0");
          setFiber(nutrientMap["Dietary Fiber"] || "");
          setSugar(nutrientMap["Sugars"] || "");
          setSaturatedFat(nutrientMap["Saturated Fat"] || "");
          setTransFat(nutrientMap["Trans Fat"] || "");
          setCholesterol(nutrientMap["Cholesterol"] || "");
          setSodium(nutrientMap["Sodium"] || "");
          setStage("edit");
          return;
        }

        // 2. Query Open Food Facts
        const offResult = await lookupOpenFoodFacts(code);
        if (offResult.found) {
          setExistingFoodId(null);
          setName(offResult.name || "");
          setBrand(offResult.brand || "");
          setServingSize(String(offResult.servingSize || 100));
          setServingUnit(offResult.servingUnit || "g");
          setCalories(String(Math.round(offResult.calories || 0)));
          setProtein(String(Math.round((offResult.protein || 0) * 10) / 10));
          setFat(String(Math.round((offResult.fat || 0) * 10) / 10));
          setCarbs(String(Math.round((offResult.carbs || 0) * 10) / 10));
          setFiber(offResult.fiber != null ? String(Math.round(offResult.fiber * 10) / 10) : "");
          setSugar(offResult.sugar != null ? String(Math.round(offResult.sugar * 10) / 10) : "");
          setSaturatedFat(offResult.saturatedFat != null ? String(Math.round(offResult.saturatedFat * 10) / 10) : "");
          setTransFat(offResult.transFat != null ? String(Math.round(offResult.transFat * 10) / 10) : "");
          setCholesterol(offResult.cholesterol != null ? String(Math.round(offResult.cholesterol * 10) / 10) : "");
          setSodium(offResult.sodium != null ? String(Math.round(offResult.sodium * 10) / 10) : "");
          setOffImageUrl(offResult.imageUrl);
          setStage("edit");
          return;
        }

        // 3. Not found
        posthog.capture("barcode_not_found", { barcode: code });
        setStage("not_found");
      } catch {
        setError("查詢過程發生錯誤，請重試");
        setStage("not_found");
      }
    },
    [stopScanner, utils.food.getByBarcode]
  );

  // Start scanner
  useEffect(() => {
    if (stage !== "scanning" || !scannerRef.current) return;

    let cancelled = false;

    async function startScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode("barcode-scanner");
      html5QrRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!cancelled) {
              handleBarcodeLookup(decodedText);
            }
          },
          () => {
            // ignore scan failures (no code detected yet)
          }
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Camera start failed:", err);
          setShowManualInput(true);
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [stage, handleBarcodeLookup, stopScanner]);

  const handleReset = () => {
    setStage("scanning");
    setBarcode("");
    setManualBarcode("");
    setError(null);
    setExistingFoodId(null);
    setOffImageUrl(undefined);
    setShowManualInput(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualBarcode.trim();
    if (code) {
      handleBarcodeLookup(code);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        let foodId = existingFoodId;

        if (!foodId) {
          // Create new food from barcode data
          const result = await createFoodFromBarcode({
            barcode,
            name,
            brand: brand || undefined,
            servingSize: parseFloat(servingSize),
            servingUnit,
            calories: parseFloat(calories) || 0,
            protein: parseFloat(protein) || 0,
            fat: parseFloat(fat) || 0,
            carbs: parseFloat(carbs) || 0,
            fiber: fiber ? parseFloat(fiber) : undefined,
            sugar: sugar ? parseFloat(sugar) : undefined,
            saturatedFat: saturatedFat ? parseFloat(saturatedFat) : undefined,
            transFat: transFat ? parseFloat(transFat) : undefined,
            cholesterol: cholesterol ? parseFloat(cholesterol) : undefined,
            sodium: sodium ? parseFloat(sodium) : undefined,
            imageUrl: offImageUrl,
          });

          if (result.success && result.foodId) {
            foodId = result.foodId;
          }
        }

        if (foodId) {
          await logFood({
            date,
            mealType: meal,
            foodId,
            servingQty: 1,
          });
          await utils.diary.getDay.invalidate();
          posthog.capture("food_logged", { source: "barcode", meal_type: meal, barcode, is_existing: !!existingFoodId, calories: parseFloat(calories) || 0 });
          toast.success("已新增到日記");
          router.push(`/hub/diary?date=${date}`);
          router.refresh();
        }
      } catch {
        toast.error("儲存失敗，請重試");
      }
    });
  };

  const handleCreateManual = () => {
    router.push(`/hub/food/create?date=${date}&meal=${meal}&barcode=${barcode}`);
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/hub/food/search?date=${date}&meal=${meal}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold">掃描條碼</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stage 1: Scanning */}
      {stage === "scanning" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <div
                id="barcode-scanner"
                ref={scannerRef}
                className="w-full min-h-[300px]"
              />
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground text-center">
            將條碼對準框內即可自動掃描
          </p>

          {/* Manual barcode input toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
            >
              <Keyboard className="h-4 w-4" />
              手動輸入條碼
            </button>
          </div>

          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="輸入條碼號碼"
                inputMode="numeric"
                autoFocus
              />
              <Button type="submit" disabled={!manualBarcode.trim()}>
                查詢
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Stage 2: Searching */}
      {stage === "searching" && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            查詢條碼 {barcode} 中...
          </p>
        </div>
      )}

      {/* Not found */}
      {stage === "not_found" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <p className="text-lg font-medium">找不到此商品</p>
              <p className="text-sm text-muted-foreground text-center">
                條碼 {barcode} 在資料庫中找不到對應的食品資料
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  重新掃描
                </Button>
                <Button onClick={handleCreateManual}>
                  手動建立
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stage 3: Edit & Confirm */}
      {stage === "edit" && (
        <div className="space-y-4">
          {existingFoodId && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 px-4 py-2 text-sm text-green-700 dark:text-green-400">
              此食品已存在於本地資料庫
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">條碼：{barcode}</p>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              重新掃描
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
                    <label className="text-xs font-medium text-blue-500">蛋白質 (g)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-amber-500">碳水 (g)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-rose-500">脂肪 (g)</label>
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
                  <p className="text-xs text-muted-foreground mb-2">其他營養素</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">飽和脂肪 (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={saturatedFat}
                        onChange={(e) => setSaturatedFat(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">反式脂肪 (g)</label>
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
                      <label className="text-xs font-medium">膳食纖維 (g)</label>
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
                      <label className="text-xs font-medium">膽固醇 (mg)</label>
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
              {isPending ? "建立中..." : existingFoodId ? "確認並新增到日記" : "儲存並新增到日記"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ScanBarcodePage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-4 space-y-4">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
