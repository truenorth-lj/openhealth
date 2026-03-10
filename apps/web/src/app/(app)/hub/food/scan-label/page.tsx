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
import { NUTRIENT_IDS, DEFAULT_SERVING_SIZE } from "@open-health/shared/constants";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import posthog from "posthog-js";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["food", "common"]);
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
  const [showUpgrade, setShowUpgrade] = useState(false);
  const utils = trpc.useUtils();

  // Form fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState(String(DEFAULT_SERVING_SIZE));
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
  const [calcium, setCalcium] = useState("");
  const [iron, setIron] = useState("");
  const [potassium, setPotassium] = useState("");
  const [vitaminA, setVitaminA] = useState("");
  const [vitaminC, setVitaminC] = useState("");
  const [vitaminD, setVitaminD] = useState("");
  const [notes, setNotes] = useState("");

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
      setError(t("food:fileReadError"));
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
          setServingSize(String(data.servingSize ?? DEFAULT_SERVING_SIZE));
          setServingUnit(data.servingUnit || "g");
          setCalories(String(data.calories || 0));
          setProtein(String(data.proteinG || 0));
          setCarbs(String(data.carbsG || 0));
          setFat(String(data.fatG || 0));
          setSodium(String(data.sodiumMg ?? ""));
          setSugar(String(data.sugarG ?? ""));
          setFiber(String(data.fiberG ?? ""));
          setSaturatedFat(String(data.saturatedFatG ?? ""));
          setTransFat(String(data.transFatG ?? ""));
          setCholesterol(String(data.cholesterolMg ?? ""));
          setCalcium(String(data.calciumMg ?? ""));
          setIron(String(data.ironMg ?? ""));
          setPotassium(String(data.potassiumMg ?? ""));
          setVitaminA(String(data.vitaminAMcg ?? ""));
          setVitaminC(String(data.vitaminCMg ?? ""));
          setVitaminD(String(data.vitaminDMcg ?? ""));
          setNotes(data.notes ?? "");
          posthog.capture("ai_label_scanned", { success: true });
          setStage("edit");
        } else {
          posthog.capture("ai_label_scanned", { success: false });
          setError(result.error || t("food:recognitionFailed"));
          setStage("capture");
        }
      } catch (err) {
        if (err instanceof Error && err.message === "AI_LIMIT_REACHED") {
          posthog.capture("ai_limit_reached", { feature: "label_scan" });
          setShowUpgrade(true);
          setStage("capture");
        } else {
          setError(t("food:recognitionError"));
          setStage("capture");
        }
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
        if (calcium) nutrients.push({ nutrientId: NUTRIENT_IDS.calcium, amount: parseFloat(calcium) });
        if (iron) nutrients.push({ nutrientId: NUTRIENT_IDS.iron, amount: parseFloat(iron) });
        if (potassium) nutrients.push({ nutrientId: NUTRIENT_IDS.potassium, amount: parseFloat(potassium) });
        if (vitaminA) nutrients.push({ nutrientId: NUTRIENT_IDS.vitaminA, amount: parseFloat(vitaminA) });
        if (vitaminC) nutrients.push({ nutrientId: NUTRIENT_IDS.vitaminC, amount: parseFloat(vitaminC) });
        if (vitaminD) nutrients.push({ nutrientId: NUTRIENT_IDS.vitaminD, amount: parseFloat(vitaminD) });

        const result = await createCustomFood({
          name,
          brand: brand || undefined,
          description: notes || undefined,
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
          posthog.capture("food_logged", { source: "label_scan", meal_type: meal, calories: parseFloat(calories) });
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
        <h1 className="font-semibold">{t("food:scanLabelTitle")}</h1>
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
                {t("food:takePhotoOfLabel")}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                {t("food:takePhoto")}
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <ImageIcon className="h-4 w-4" />
                {t("food:chooseFromGallery")}
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
                alt={t("food:labelPhotoAlt")}
                fill
                className="object-contain"
              />
            </div>
          )}
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("food:recognizing")}</p>
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
                alt={t("food:labelPhotoAlt")}
                fill
                className="object-contain"
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              {t("food:retakePhoto")}
            </Button>
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
                  <label className="text-sm font-medium">{t("food:caloriesKcalRequired")} *</label>
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

                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">{t("common:labels.otherNutrients")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.saturatedFat")} (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={saturatedFat}
                        onChange={(e) => setSaturatedFat(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.transFat")} (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={transFat}
                        onChange={(e) => setTransFat(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.sugar")} (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={sugar}
                        onChange={(e) => setSugar(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.dietaryFiber")} (g)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={fiber}
                        onChange={(e) => setFiber(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.sodium")} (mg)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={sodium}
                        onChange={(e) => setSodium(e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.cholesterol")} (mg)</label>
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

                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">{t("common:labels.microNutrients")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.calcium")} (mg)</label>
                      <Input type="number" step="0.1" value={calcium} onChange={(e) => setCalcium(e.target.value)} placeholder="-" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.iron")} (mg)</label>
                      <Input type="number" step="0.1" value={iron} onChange={(e) => setIron(e.target.value)} placeholder="-" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.potassium")} (mg)</label>
                      <Input type="number" step="0.1" value={potassium} onChange={(e) => setPotassium(e.target.value)} placeholder="-" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.vitaminA")} (mcg)</label>
                      <Input type="number" step="0.1" value={vitaminA} onChange={(e) => setVitaminA(e.target.value)} placeholder="-" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.vitaminC")} (mg)</label>
                      <Input type="number" step="0.1" value={vitaminC} onChange={(e) => setVitaminC(e.target.value)} placeholder="-" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">{t("common:nutrientLabels.vitaminD")} (mcg)</label>
                      <Input type="number" step="0.1" value={vitaminD} onChange={(e) => setVitaminD(e.target.value)} placeholder="-" />
                    </div>
                  </div>
                </div>

                {notes && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-muted-foreground mb-1">{t("common:labels.notes")}</p>
                    <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">{notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("common:buttons.creating") : t("food:confirmAndAdd")}
            </Button>
          </form>
        </div>
      )}

      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
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
