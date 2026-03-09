"use client";

import { Check, Loader2, AlertCircle, Scale, Droplets } from "lucide-react";

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

const TOOL_CONFIG: Record<
  string,
  {
    label: string;
    loadingText: string;
    icon: typeof Scale;
    formatResult: (output: Record<string, unknown>) => string;
  }
> = {
  logWeight: {
    label: "體重紀錄",
    loadingText: "正在記錄體重...",
    icon: Scale,
    formatResult: (o) => `${o.weightKg} kg — ${o.date}`,
  },
  logWater: {
    label: "飲水紀錄",
    loadingText: "正在記錄飲水...",
    icon: Droplets,
    formatResult: (o) =>
      `+${o.amountMl}ml（今日合計 ${o.totalMl}/${o.targetMl}ml）`,
  },
};

export function ActionConfirmCard({ part }: ActionConfirmCardProps) {
  const config = TOOL_CONFIG[part.toolName];
  if (!config) return null;

  const Icon = config.icon;

  // Loading state
  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="my-2 w-full max-w-[85%] rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          {config.loadingText}
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
        ? "記錄失敗，請重試"
        : (part.output?.error as string) ?? "未知錯誤";
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
          <span className="text-sm font-medium">{config.label}</span>
          <span className="ml-2 text-xs text-neutral-400">
            {config.formatResult(part.output)}
          </span>
        </div>
      </div>
    </div>
  );
}
