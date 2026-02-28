"use client";

import { useState, useTransition, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc-client";
import { updateGoals } from "@/server/actions/goals";

export default function GoalsPage() {
  const { data: goals } = trpc.user.getGoals.useQuery();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [calorieTarget, setCalorieTarget] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [fiberG, setFiberG] = useState("");

  // Pre-fill when data loads
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && goals !== undefined) {
      if (goals) {
        setCalorieTarget(goals.calorieTarget ? String(goals.calorieTarget) : "");
        setProteinG(goals.proteinG ? String(goals.proteinG) : "");
        setCarbsG(goals.carbsG ? String(goals.carbsG) : "");
        setFatG(goals.fatG ? String(goals.fatG) : "");
        setFiberG(goals.fiberG ? String(goals.fiberG) : "");
      }
      setInitialized(true);
    }
  }, [goals, initialized]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateGoals({
          calorieTarget: calorieTarget ? Number(calorieTarget) : null,
          proteinG: proteinG ? Number(proteinG) : null,
          carbsG: carbsG ? Number(carbsG) : null,
          fatG: fatG ? Number(fatG) : null,
          fiberG: fiberG ? Number(fiberG) : null,
        });
        toast.success("目標已儲存");
        router.refresh();
      } catch {
        toast.error("儲存失敗，請稍後再試");
      }
    });
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">目標設定</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">每日卡路里目標</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">目標卡路里 (kcal)</label>
            <Input
              type="number"
              placeholder="2000"
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">巨量營養素目標 (g)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-blue-500">蛋白質</label>
              <Input
                type="number"
                placeholder="150"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-amber-500">碳水</label>
              <Input
                type="number"
                placeholder="250"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-rose-500">脂肪</label>
              <Input
                type="number"
                placeholder="67"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-emerald-500">纖維</label>
              <Input
                type="number"
                placeholder="28"
                value={fiberG}
                onChange={(e) => setFiberG(e.target.value)}
              />
            </div>
          </div>
          {calorieTarget && proteinG && carbsG && fatG && (
            <p className="text-xs text-muted-foreground">
              巨量營養素合計:{" "}
              {Math.round(
                Number(proteinG) * 4 +
                  Number(carbsG) * 4 +
                  Number(fatG) * 9
              )}{" "}
              kcal (目標: {calorieTarget} kcal)
            </p>
          )}
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSave} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            儲存中...
          </>
        ) : (
          "儲存目標"
        )}
      </Button>
    </div>
  );
}
