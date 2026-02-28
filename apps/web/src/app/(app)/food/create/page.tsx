"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCustomFood } from "@/server/actions/food";
import { logFood } from "@/server/actions/diary";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";

function CreateFoodContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const meal = (searchParams.get("meal") || "snack") as "breakfast" | "lunch" | "dinner" | "snack";
  const defaultName = searchParams.get("name") || "";

  const [isPending, startTransition] = useTransition();
  const utils = trpc.useUtils();
  const [name, setName] = useState(defaultName);
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState("100");
  const [servingUnit, setServingUnit] = useState("g");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCustomFood({
        name,
        brand: brand || undefined,
        servingSize: parseFloat(servingSize),
        servingUnit,
        calories: parseFloat(calories),
        nutrients: [
          { nutrientId: 1, amount: parseFloat(protein) || 0 },
          { nutrientId: 2, amount: parseFloat(fat) || 0 },
          { nutrientId: 3, amount: parseFloat(carbs) || 0 },
        ],
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
        <h1 className="font-semibold">自訂食物</h1>
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
              <label className="text-sm font-medium">卡路里 (kcal) *</label>
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
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "建立中..." : "建立並新增到日記"}
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
