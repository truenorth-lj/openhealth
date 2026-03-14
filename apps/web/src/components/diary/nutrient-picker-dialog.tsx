"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc-client";
import { NUTRIENT_I18N_KEY, MACRO_NUTRIENT_IDS } from "@open-health/shared/constants";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const EXCLUDED_SET = new Set(MACRO_NUTRIENT_IDS);

interface NutrientPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSave: (ids: number[]) => void;
}

export function NutrientPickerDialog({
  open,
  onOpenChange,
  selectedIds,
  onSave,
}: NutrientPickerDialogProps) {
  const { t } = useTranslation(["diary", "common", "nutrients", "food"]);
  const [selected, setSelected] = useState<Set<number>>(new Set(selectedIds));
  const { data: nutrients } = trpc.user.getNutrientDefinitions.useQuery(
    undefined,
    { enabled: open }
  );

  useEffect(() => {
    setSelected(new Set(selectedIds));
  }, [selectedIds, open]);

  const filtered = nutrients?.filter((n) => !EXCLUDED_SET.has(n.id)) ?? [];

  const grouped = filtered.reduce(
    (acc, n) => {
      const cat = n.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(n);
      return acc;
    },
    {} as Record<string, typeof filtered>
  );

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="font-light tracking-wide">
          {t("diary:selectTrackedNutrients")}
        </DialogTitle>
      </DialogHeader>

      <div className="max-h-[60vh] overflow-y-auto mt-4 -mx-6 px-6">
        <div className="space-y-5">
          {(["macro", "vitamin", "mineral", "other"] as const).map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat} className="space-y-2">
                <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
                  {t(`food:category.${cat}`)}
                </p>
                <div className="space-y-1">
                  {items.map((n) => {
                    const isSelected = selected.has(n.id);
                    const label = NUTRIENT_I18N_KEY[n.name] ? t(`nutrients:${NUTRIENT_I18N_KEY[n.name]}`) : n.name;
                    return (
                      <button
                        key={n.id}
                        onClick={() => toggle(n.id)}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-light rounded-md transition-all duration-200 text-left ${
                          isSelected
                            ? "bg-primary/5 text-foreground"
                            : "text-neutral-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-neutral-300 dark:border-neutral-600"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" strokeWidth={2} />
                          )}
                        </div>
                        <span>{label}</span>
                        <span className="ml-auto text-[10px] text-neutral-400">
                          {n.unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
        <button
          onClick={() => onOpenChange(false)}
          className="px-4 py-2 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md hover:border-foreground/20 transition-all duration-200"
        >
          {t("common:buttons.cancel")}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-light bg-primary text-white rounded-md hover:bg-primary/90 transition-all duration-200"
        >
          {t("diary:saveCount", { count: selected.size })}
        </button>
      </div>
    </Dialog>
  );
}
