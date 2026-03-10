"use client";

import { Check, Loader2, AlertCircle, Scale, Droplets } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ActionConfirmCardProps {
  part: {
    toolName: string;
    toolCallId: string;
    state: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output?: Record<string, any>;
  };
}

const TOOL_ICONS: Record<string, typeof Scale> = {
  logWeight: Scale,
  logWater: Droplets,
};

export function ActionConfirmCard({ part }: ActionConfirmCardProps) {
  const { t } = useTranslation("ai");
  const Icon = TOOL_ICONS[part.toolName];
  if (!Icon) return null;

  const label = part.toolName === "logWeight" ? t("actionConfirm.weightLog") : t("actionConfirm.waterLog");
  const loadingText = part.toolName === "logWeight" ? t("actionConfirm.loggingWeight") : t("actionConfirm.loggingWater");
  const formatResult = (o: Record<string, unknown>) =>
    part.toolName === "logWeight"
      ? `${o.weightKg} kg — ${o.date}`
      : t("actionConfirm.waterSummary", { amount: o.amountMl, total: o.totalMl, target: o.targetMl });

  // Loading state
  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="my-2 w-full max-w-[85%] rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          {loadingText}
        </div>
      </div>
    );
  }

  // Error state
  if (
    part.state === "output-error" ||
    (part.output && "error" in part.output)
  ) {
    const errorText =
      part.state === "output-error"
        ? t("actionConfirm.logFailed")
        : (part.output?.error as string) ?? t("actionConfirm.unknownError");
    return (
      <div className="my-2 w-full max-w-[85%] rounded-xl border border-destructive/20 p-4">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
          {errorText}
        </div>
      </div>
    );
  }

  // Output available — auto-confirmed (write already happened)
  if (part.state !== "output-available" || !part.output || "error" in part.output) {
    return null;
  }

  return (
    <div className="my-2 w-full max-w-[85%] rounded-xl border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/20 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <Icon className="h-4 w-4 text-green-600" strokeWidth={1.5} />
        <div>
          <span className="text-sm font-medium">{label}</span>
          <span className="ml-2 text-xs text-neutral-400">
            {formatResult(part.output)}
          </span>
        </div>
      </div>
    </div>
  );
}
