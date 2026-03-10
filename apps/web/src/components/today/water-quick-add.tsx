"use client";

import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import posthog from "posthog-js";
import { useTranslation } from "react-i18next";

const QUICK_AMOUNTS = [150, 250, 350, 500];

export function WaterQuickAdd({
  date,
  isAuthenticated,
}: {
  date: string;
  isAuthenticated: boolean;
}) {
  const { t } = useTranslation("water");
  const utils = trpc.useUtils();

  const logWater = trpc.water.logWater.useMutation({
    onSuccess: (_data, variables) => {
      utils.water.getToday.invalidate({ date });
      utils.water.getLogs.invalidate({ date });
      posthog.capture("water_logged", { amount_ml: variables.amountMl });
    },
    onError: () => {
      toast.error(t("logError"));
    },
  });

  const handleQuickAdd = (amount: number) => {
    if (!isAuthenticated) return;
    logWater.mutate({ amountMl: amount, date });
  };

  return (
    <div className="flex gap-2">
      {QUICK_AMOUNTS.map((amount) => (
        <button
          key={amount}
          onClick={() => handleQuickAdd(amount)}
          disabled={logWater.isPending}
          className="flex-1 py-2 text-xs font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20 active:scale-95 disabled:opacity-30 tabular-nums"
        >
          +{amount}
        </button>
      ))}
    </div>
  );
}
