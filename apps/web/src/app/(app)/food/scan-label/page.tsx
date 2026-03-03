"use client";

import { Suspense, useState, useTransition, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, RotateCcw, Loader2, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recognizeNutritionLabel } from "@/server/actions/nutrition-label";
import { createCustomFood } from "@/server/actions/food";
import { logFood } from "@/server/actions/diary";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";
import { NUTRIENT_IDS } from "@open-health/shared/constants";

function compressImage(dataUrl: string, maxWidth = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function ScanLabelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const meal = (searchParams.get("meal") || "snack") as
    | "breakfast"
    | "lunch"
    | "dinner"
    | "snack";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const hasTriggered = useRef(false);
  const [stage, setStage] = useState<"capture" | "recognizing" | "edit">("capture");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  // Auto-trigger camera on mount
  useEffect(() => {
    if (!hasTriggered.current && fileInputRef.current) {
      hasTriggered.current = true;
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Create preview and compress
    const reader = new FileReader();
    reader.onerror = () => {
      setError("讀取檔案失敗，請重試");
      setStage("capture");
    };
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      const dataUrl = await compressImage(rawDataUrl);
      setImagePreview(dataUrl);
      setStage("recognizing");

      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = dataUrl.split(",")[1];

      try {
        const result = await recognizeNutritionLabel(base64);

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
          setSaturatedFat(data.saturatedFatG != null ? String(data.saturatedFatG) : "");
          setTransFat(data.transFatG != null ? String(data.transFatG) : "");
          setCholesterol(data.cholesterolMg != null ? String(data.cholesterolMg) : "");
          setStage("edit");
        } else {
          setError(result.error || "辨識失敗");
          setStage("capture");
        }
      } catch {
        setError("辨識過程發生錯誤，請重試");
        setStage("capture");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setStage("capture");
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const nutrients: { nutrientId: number; amount: number }[] = [
          { nutrientId: NUTRIENT_IDS.protein, amount: parseFloat(protein) || 0 },
          { nutrientId: NUTRIENT_IDS.totalFat, amount: parseFloat(fat) || 0 },
          { nutrientId: NUTRIENT_IDS.totalCarbs, amount: parseFloat(carbs) || 0 },
        ];

        // Add optional nutrients if provided
        if (fiber) nutrients.push({ nutrientId: NUTRIENT_IDS.fiber, amount: parseFloat(fiber) });
        if (sugar) nutrients.push({ nutrientId: NUTRIENT_IDS.sugar, amount: parseFloat(sugar) });
        if (saturatedFat) nutrients.push({ nutrientId: NUTRIENT_IDS.saturatedFat, amount: parseFloat(saturatedFat) });
        if (transFat) nutrients.push({ nutrientId: NUTRIENT_IDS.transFat, amount: parseFloat(transFat) });
        if (cholesterol) nutrients.push({ nutrientId: NUTRIENT_IDS.cholesterol, amount: parseFloat(cholesterol) });
        if (sodium) nutrients.push({ nutrientId: NUTRIENT_IDS.sodium, amount: parseFloat(sodium) });

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
        <h1 className="font-semibold">拍照辨識營養標籤</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stage 1: Capture */}
      {stage === "capture" && (
        <div className="space-y-4">
          {/* Hidden camera input (auto-triggered on mount) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          {/* Hidden gallery input (no capture attribute) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <Camera className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                拍攝食品營養標籤照片
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                拍照
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <ImageIcon className="h-4 w-4" />
                從相簿選擇
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stage 2: Recognizing */}
      {stage === "recognizing" && (
        <div className="space-y-4">
          {imagePreview && (
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-muted">
              <Image
                src={imagePreview}
                alt="營養標籤照片"
                fill
                className="object-contain"
              />
            </div>
          )}
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">辨識中...</p>
          </div>
        </div>
      )}

      {/* Stage 3: Edit & Confirm */}
      {stage === "edit" && (
        <div className="space-y-4">
          {imagePreview && (
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-muted">
              <Image
                src={imagePreview}
                alt="營養標籤照片"
                fill
                className="object-contain"
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              重新拍照
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
              {isPending ? "建立中..." : "確認並新增到日記"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ScanLabelPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-4 space-y-4">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      }
    >
      <ScanLabelContent />
    </Suspense>
  );
}
