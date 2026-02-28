"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { removeEntry } from "@/server/actions/diary";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const mealLabels: Record<MealType, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "點心",
};

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

  const addHref = `/food/search?date=${date}&meal=${mealType}`;

  return (
    <div className="mx-4 mt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{mealIcons[mealType]}</span>
          <h3 className="font-semibold">{mealLabels[mealType]}</h3>
          <span className="text-sm text-muted-foreground">
            {Math.round(mealCalories)} kcal
          </span>
        </div>
        <Link href={addHref} onClick={handleAddClick}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {entries.length === 0 ? (
        <Link
          href={addHref}
          onClick={handleAddClick}
          className="block rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          點擊新增食物
        </Link>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryRow({ entry }: { entry: DiaryEntry }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const utils = trpc.useUtils();

  const handleRemove = () => {
    startTransition(async () => {
      await removeEntry(entry.id);
      await utils.diary.getDay.invalidate();
      router.refresh();
    });
  };

  return (
    <div
      className={`flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <Link href={`/food/${entry.foodId}`} className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.foodName}</p>
        <p className="text-xs text-muted-foreground">
          {entry.servingQty} x {entry.foodServingSize}
          {entry.foodServingUnit}
          {entry.foodBrand ? ` \u00B7 ${entry.foodBrand}` : ""}
        </p>
      </Link>
      <div className="flex items-center gap-2 ml-2">
        <span className="text-sm font-medium tabular-nums">
          {Math.round(Number(entry.calories || 0))}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
