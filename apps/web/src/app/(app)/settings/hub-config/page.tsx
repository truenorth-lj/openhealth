"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";
import {
  DEFAULT_HUB_ITEMS,
  HUB_SECTIONS,
  type HubUserConfig,
  type HubItemKey,
} from "@open-health/shared/hub";

export default function HubConfigPage() {
  const router = useRouter();
  const { t } = useTranslation(["common", "settings"]);
  const utils = trpc.useUtils();

  const { data: savedConfig, isLoading } = trpc.hub.getConfig.useQuery();
  const updateMutation = trpc.hub.updateConfig.useMutation({
    onSuccess: () => {
      utils.hub.getConfig.invalidate();
    },
  });

  // Local state for editing — initialized from saved config
  const [localConfig, setLocalConfig] = useState<HubUserConfig | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // The effective config being edited
  const config = useMemo(
    () => localConfig ?? savedConfig ?? {},
    [localConfig, savedConfig],
  );

  const isVisible = useCallback(
    (key: HubItemKey) => {
      const cfg = config[key];
      return cfg ? cfg.visible : true; // default visible
    },
    [config],
  );

  const toggleItem = useCallback(
    (key: HubItemKey) => {
      setLocalConfig((prev) => {
        const current = prev ?? savedConfig ?? {};
        const currentVisible = current[key]?.visible ?? true;
        return {
          ...current,
          [key]: { ...current[key], visible: !currentVisible },
        };
      });
      setSaveStatus("idle");
    },
    [savedConfig],
  );

  const handleSave = async () => {
    if (!localConfig) return;
    setSaveStatus("saving");
    try {
      await updateMutation.mutateAsync(localConfig);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("idle");
    }
  };

  const handleReset = async () => {
    setSaveStatus("saving");
    try {
      await updateMutation.mutateAsync({});
      setLocalConfig(null);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("idle");
    }
  };

  const hasChanges = localConfig !== null;

  // Group default items by section for display
  const sections = HUB_SECTIONS.map((sectionKey) => ({
    sectionKey,
    items: DEFAULT_HUB_ITEMS.filter((item) => item.sectionKey === sectionKey),
  })).filter((s) => s.items.length > 0);

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.06] dark:border-white/[0.06] transition-all hover:border-foreground/20"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-xl font-light tracking-wide">
            {t("settings:hubConfigPage.title")}
          </h1>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">
            {t("settings:hubConfigPage.description")}
          </p>
        </div>
      </div>

      {/* Sections with toggles */}
      {sections.map((section) => (
        <div key={section.sectionKey} className="space-y-2">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            {t(section.sectionKey)}
          </p>
          <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
            {section.items.map((item) => {
              const visible = isVisible(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => toggleItem(item.key)}
                  className="flex w-full items-center justify-between px-1 py-3 border-b border-black/[0.06] dark:border-white/[0.06] transition-all duration-200"
                >
                  <span
                    className={cn(
                      "text-sm font-light transition-colors",
                      visible
                        ? "text-foreground"
                        : "text-neutral-300 dark:text-neutral-700 line-through",
                    )}
                  >
                    {t(item.labelKey)}
                  </span>
                  {/* Toggle switch */}
                  <div
                    className={cn(
                      "relative h-6 w-10 rounded-full transition-colors duration-200",
                      visible
                        ? "bg-primary"
                        : "bg-neutral-200 dark:bg-neutral-800",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                        visible ? "translate-x-4.5" : "translate-x-0.5",
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-lg border border-black/[0.06] dark:border-white/[0.06] px-4 py-2.5 text-sm font-light text-neutral-500 transition-all hover:border-foreground/20 hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("settings:hubConfigPage.reset")}
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveStatus === "saving"}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-light transition-all duration-200",
            hasChanges
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600",
          )}
        >
          {saveStatus === "saving"
            ? t("settings:hubConfigPage.saving")
            : saveStatus === "saved"
              ? t("settings:hubConfigPage.saved")
              : t("settings:hubConfigPage.save")}
        </button>
      </div>
    </div>
  );
}
