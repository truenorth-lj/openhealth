"use client";

import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { cn } from "@/lib/utils";

const PRO_FEATURES = [
  "無限 AI 辨識營養標籤",
  "無限 AI 估算營養",
  "每日 100 次 AI 營養顧問",
  "微量營養素追蹤",
  "運動紀錄",
  "間歇性斷食追蹤",
  "進度照片",
  "資料匯出",
];

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          升級至 Pro
        </DialogTitle>
        <DialogDescription>
          解鎖所有進階功能，讓健康管理更完整
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Interval toggle */}
        <div className="flex rounded-lg border p-1">
          <button
            onClick={() => setInterval("monthly")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm transition-all",
              interval === "monthly"
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            月付
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm transition-all",
              interval === "yearly"
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            年付
            <span className="ml-1 text-xs text-green-600">省 33%</span>
          </button>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold">
              NT${interval === "monthly" ? "100" : "800"}
            </span>
            <span className="text-sm text-muted-foreground">
              / {interval === "monthly" ? "月" : "年"}
            </span>
          </div>
          <ul className="space-y-2">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <Button
          className="w-full"
          onClick={() => createCheckout.mutate({ interval })}
          disabled={createCheckout.isPending}
        >
          {createCheckout.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          升級至 Pro
        </Button>

        {createCheckout.isError && (
          <p className="text-xs text-center text-destructive">
            發生錯誤，請稍後再試
          </p>
        )}
      </div>
    </Dialog>
  );
}
