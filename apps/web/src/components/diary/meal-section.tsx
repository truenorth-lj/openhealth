"use client";

import { Plus, Minus, Trash2 } from "lucide-react";
import Link from "next/link";
import { removeEntry, updateEntryServings } from "@/server/actions/diary";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import posthog from "posthog-js";
import { useTranslation } from "react-i18next";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const mealIcons: Record<MealType, string> = {
  breakfast: "\u{1F305}",
  lunch: "\u{2600}\u{FE0F}",
  dinner: "\u{1F319}",
  snack: "\u{1F36A}",
};

interface DiaryEntry {
  id: string;
  foodId: string;
  foodName: string;
  foodBrand: string | null;
  servingQty: string;
  foodServingSize: string;
  foodServingUnit: string;
  calories: string | null;
  proteinG: string | null;
  carbsG: string | null;
  fatG: string | null;
}

interface MealSectionProps {
  mealType: MealType;
  entries: DiaryEntry[];
  date: string;
  onRequireAuth?: () => void;
  isAuthenticated?: boolean;
}

export function MealSection({ mealType, entries, date, onRequireAuth, isAuthenticated }: MealSectionProps) {
  const { t } = useTranslation("diary");
  const mealCalories = entries.reduce(
    (sum, e) => sum + Number(e.calories || 0),
    0
  );

  const handleAddClick = (e: React.MouseEvent) => {
    if (!isAuthenticated && onRequireAuth) {
      e.preventDefault();
      onRequireAuth();
    }
  };

  const addHref = `/hub/food/search?date=${date}&meal=${mealType}`;

  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{mealIcons[mealType]}</span>
          <h3 className="text-sm font-light">{t(mealType)}</h3>
          <span className="text-xs text-neutral-400 dark:text-neutral-600 tabular-nums">
            {Math.round(mealCalories)} kcal
          </span>
        </div>
        <Link href={addHref} onClick={handleAddClick}>
          <button className="p-1.5 text-neutral-400 transition-all duration-300 hover:text-foreground">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </Link>
      </div>

      {entries.length === 0 ? (
        <Link
          href={addHref}
          onClick={handleAddClick}
          className="block border-b border-dashed border-black/[0.06] dark:border-white/[0.06] py-3 text-center text-sm font-light text-neutral-400 transition-all duration-300 hover:text-primary"
        >
          {t("clickToAddFood")}
        </Link>
      ) : (
        <div>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} mealType={mealType} />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryRow({ entry, mealType }: { entry: DiaryEntry; mealType: MealType }) {
  const [isPending, startTransition] = useTransition();
  const [localQty, setLocalQty] = useState(Number(entry.servingQty));
  const router = useRouter();
  const utils = trpc.useUtils();

  const handleRemove = () => {
    startTransition(async () => {
      await removeEntry(entry.id);
      await utils.diary.getDay.invalidate();
      posthog.capture("food_deleted", { meal_type: mealType, calories: Number(entry.calories || 0) });
      router.refresh();
    });
  };

  const handleQtyChange = (delta: number) => {
    const prevQty = localQty;
    const newQty = Math.max(1, localQty + delta);
    setLocalQty(newQty);
    startTransition(async () => {
      try {
        await updateEntryServings({ entryId: entry.id, servingQty: newQty });
        await utils.diary.getDay.invalidate();
        router.refresh();
      } catch {
        setLocalQty(prevQty);
      }
    });
  };

  // Compute display calories based on localQty vs stored qty
  const perServingCal = Number(entry.calories || 0) / Number(entry.servingQty || 1);
  const displayCal = Math.round(perServingCal * localQty);

  return (
    <div
      className={`flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] py-2.5 ${
        isPending ? "opacity-30" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <Link href={`/hub/food/${entry.foodId}`}>
          <p className="text-sm font-light truncate">{entry.foodName}</p>
        </Link>
        <div className="flex items-center gap-1 mt-0.5">
          <button
            className="flex items-center justify-center h-5 w-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            onClick={() => handleQtyChange(-1)}
            disabled={isPending || localQty <= 1}
          >
            <Minus className="h-3 w-3" strokeWidth={2} />
          </button>
          <span className="text-xs tabular-nums font-medium min-w-[2rem] text-center">
            {localQty}
          </span>
          <button
            className="flex items-center justify-center h-5 w-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            onClick={() => handleQtyChange(1)}
            disabled={isPending}
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
          </button>
          <span className="text-xs text-neutral-400 dark:text-neutral-600 ml-0.5">
            × {entry.foodServingSize}{entry.foodServingUnit}
            {entry.foodBrand ? ` · ${entry.foodBrand}` : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <span className="text-sm font-light tabular-nums text-neutral-500">
          {displayCal}
        </span>
        <button
          className="p-1 text-neutral-300 dark:text-neutral-700 transition-all duration-300 hover:text-destructive"
          onClick={handleRemove}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
