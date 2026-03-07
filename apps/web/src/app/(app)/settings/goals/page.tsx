"use client";

import { useState, useTransition, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc-client";
import { updateGoals } from "@/server/actions/goals";
import posthog from "posthog-js";

export default function GoalsPage() {
  const { data: goals } = trpc.user.getGoals.useQuery();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { data: waterGoal } = trpc.water.getGoal.useQuery();
  const setWaterGoal = trpc.water.setGoal.useMutation({
    onSuccess: () => {
      toast.success("水分目標已儲存");
    },
  });

  const [calorieTarget, setCalorieTarget] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [fiberG, setFiberG] = useState("");
  const [waterTargetMl, setWaterTargetMl] = useState("");

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

  useEffect(() => {
    if (waterGoal?.dailyTargetMl) {
      setWaterTargetMl(String(waterGoal.dailyTargetMl));
    }
  }, [waterGoal]);

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
        if (waterTargetMl) {
          const wml = parseInt(waterTargetMl, 10);
          if (!isNaN(wml) && wml >= 500 && wml <= 10000) {
            setWaterGoal.mutate({ dailyTargetMl: wml });
          }
        }
        posthog.capture("goals_updated", { calorie_target: calorieTarget ? Number(calorieTarget) : null });
        toast.success("目標已儲存");
        router.refresh();
      } catch {
        toast.error("儲存失敗，請稍後再試");
      }
    });
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 text-neutral-400 transition-all duration-300 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-light tracking-wide">目標設定</h1>
      </div>

      {/* Calorie target */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          每日卡路里目標
        </p>
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-light text-neutral-500">目標卡路里 (kcal)</label>
            <Input
              type="number"
              placeholder="2000"
              value={calorieTarget}
              onChange={(e) => setCalorieTarget(e.target.value)}
              className="border-black/[0.06] dark:border-white/[0.06] font-light"
            />
          </div>
        </div>
      </div>

      {/* Macro targets */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          巨量營養素目標 (g)
        </p>
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-4 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-light text-blue-500">蛋白質</label>
              <Input
                type="number"
                placeholder="150"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
                className="border-black/[0.06] dark:border-white/[0.06] font-light"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-light text-amber-500">碳水</label>
              <Input
                type="number"
                placeholder="250"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                className="border-black/[0.06] dark:border-white/[0.06] font-light"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-light text-rose-500">脂肪</label>
              <Input
                type="number"
                placeholder="67"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
                className="border-black/[0.06] dark:border-white/[0.06] font-light"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-light text-emerald-500">纖維</label>
              <Input
                type="number"
                placeholder="28"
                value={fiberG}
                onChange={(e) => setFiberG(e.target.value)}
                className="border-black/[0.06] dark:border-white/[0.06] font-light"
              />
            </div>
          </div>
          {calorieTarget && proteinG && carbsG && fatG && (
            <p className="text-xs font-light text-neutral-400">
              巨量營養素合計:{" "}
              {Math.round(
                Number(proteinG) * 4 +
                  Number(carbsG) * 4 +
                  Number(fatG) * 9
              )}{" "}
              kcal (目標: {calorieTarget} kcal)
            </p>
          )}
        </div>
      </div>

      {/* Water target */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          每日飲水目標
        </p>
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-light text-sky-500">飲水量 (ml)</label>
            <Input
              type="number"
              placeholder="2000"
              value={waterTargetMl}
              onChange={(e) => setWaterTargetMl(e.target.value)}
              min={500}
              max={10000}
              step={100}
              className="border-black/[0.06] dark:border-white/[0.06] font-light"
            />
            <p className="text-xs font-light text-neutral-400">建議範圍：500 - 10000 ml</p>
          </div>
        </div>
      </div>

      <button
        className="w-full py-2.5 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20 disabled:opacity-30"
        onClick={handleSave}
        disabled={isPending}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
            儲存中...
          </span>
        ) : (
          "儲存目標"
        )}
      </button>
    </div>
  );
}
