"use client";

import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { NUTRIENT_I18N_KEY } from "@open-health/shared/constants";
import { NutrientPickerDialog } from "./nutrient-picker-dialog";
import { useTranslation } from "react-i18next";

interface MicroNutrientSectionProps {
  date: string;
  trackedNutrientIds: number[];
}

export function MicroNutrientSection({
  date,
  trackedNutrientIds,
}: MicroNutrientSectionProps) {
  const { t } = useTranslation(["diary", "nutrients"]);
  const [expanded, setExpanded] = useState(trackedNutrientIds.length > 0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const utils = trpc.useUtils();
  const updateTracked = trpc.user.updateTrackedNutrients.useMutation({
    onSuccess: () => {
      utils.user.getGoals.invalidate();
    },
  });

  const { data: nutrients } = trpc.diary.getDayNutrients.useQuery(
    { date, nutrientIds: trackedNutrientIds },
    { enabled: trackedNutrientIds.length > 0 && expanded }
  );

  const { data: allNutrientDefs } = trpc.user.getNutrientDefinitions.useQuery(
    undefined,
    { enabled: trackedNutrientIds.length > 0 && expanded }
  );

  const handleSave = (ids: number[]) => {
    updateTracked.mutate({ nutrientIds: ids });
  };

  const hasTracked = trackedNutrientIds.length > 0;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => hasTracked ? setExpanded(!expanded) : setPickerOpen(true)}
          className="flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
        >
          {t("microNutrients")}
          {hasTracked && (
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              strokeWidth={1.5}
            />
          )}
        </button>
        <button
          onClick={() => setPickerOpen(true)}
          className="ml-auto p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title={t("setupTrackedNutrients")}
        >
          <Settings2 className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
        </button>
      </div>

      {!hasTracked && (
        <button
          onClick={() => setPickerOpen(true)}
          className="mt-2 text-xs font-light text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          {t("clickToSetupNutrients")}
        </button>
      )}

      {hasTracked && expanded && (
        <div className="mt-3 space-y-2.5">
          {trackedNutrientIds.map((id) => {
            const def = allNutrientDefs?.find((d) => d.id === id);
            const dayData = nutrients?.find((n) => n.nutrientId === id);
            const name = def
              ? (NUTRIENT_I18N_KEY[def.name] ? t(`nutrients:${NUTRIENT_I18N_KEY[def.name]}`) : def.name)
              : `#${id}`;
            const unit = def?.unit ?? "";
            const dailyValue = def?.dailyValue ? Number(def.dailyValue) : null;
            const amount = dayData?.totalAmount ?? 0;
            const percent =
              dailyValue && dailyValue > 0
                ? Math.min((amount / dailyValue) * 100, 100)
                : null;

            return (
              <div key={id} className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-600">
                    {name}
                  </p>
                  <p className="text-xs font-light tabular-nums">
                    {amount.toFixed(amount < 10 ? 1 : 0)}
                    <span className="text-neutral-300 dark:text-neutral-700">
                      {dailyValue
                        ? `/${dailyValue} ${unit}`
                        : ` ${unit}`}
                    </span>
                  </p>
                </div>
                <div className="h-px bg-neutral-200 dark:bg-neutral-800 relative">
                  {percent !== null && (
                    <div
                      className="absolute left-0 top-0 h-px bg-primary/60 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NutrientPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedIds={trackedNutrientIds}
        onSave={handleSave}
      />
    </div>
  );
}
