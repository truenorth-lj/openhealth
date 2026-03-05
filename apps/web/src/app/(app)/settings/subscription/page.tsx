"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Check, Loader2 } from "lucide-react";
import Link from "next/link";
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

export default function SubscriptionPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const isLoggedIn = !!session?.user;
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  const { data: subscription, isLoading: subLoading } =
    trpc.subscription.getSubscription.useQuery(undefined, {
      enabled: isLoggedIn,
    });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const isPro = subscription?.status === "active" || subscription?.status === "trialing";
  const loading = sessionLoading || subLoading;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-light tracking-wide">訂閱方案</h1>
      </div>

      {loading && (
        <div className="text-center text-sm text-neutral-400 py-8">
          載入中...
        </div>
      )}

      {!loading && !isLoggedIn && (
        <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 text-center text-sm text-neutral-400">
          請先登入以查看訂閱方案。
        </div>
      )}

      {!loading && isLoggedIn && isPro && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Pro 方案</span>
            </div>
            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {subscription.cancelAtPeriodEnd
                  ? `方案將於 ${new Date(subscription.currentPeriodEnd).toLocaleDateString("zh-TW")} 到期`
                  : `下次續費日期：${new Date(subscription.currentPeriodEnd).toLocaleDateString("zh-TW")}`}
              </p>
            )}
            {subscription.cancelAtPeriodEnd && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                已取消自動續費，到期後將降為 Free 方案
              </p>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => createPortal.mutate()}
            disabled={createPortal.isPending}
          >
            {createPortal.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            管理訂閱
          </Button>
        </div>
      )}

      {!loading && isLoggedIn && !isPro && (
        <div className="space-y-4">
          {/* Current plan */}
          <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4">
            <p className="text-sm text-neutral-400">目前方案</p>
            <p className="text-lg font-light">Free</p>
          </div>

          {/* Interval toggle */}
          <div className="flex rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-1">
            <button
              onClick={() => setInterval("monthly")}
              className={cn(
                "flex-1 rounded-md py-2 text-sm transition-all",
                interval === "monthly"
                  ? "bg-foreground text-background font-medium"
                  : "text-neutral-400 hover:text-foreground"
              )}
            >
              月付
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={cn(
                "flex-1 rounded-md py-2 text-sm transition-all",
                interval === "yearly"
                  ? "bg-foreground text-background font-medium"
                  : "text-neutral-400 hover:text-foreground"
              )}
            >
              年付
              <span className="ml-1 text-xs text-green-600">省 33%</span>
            </button>
          </div>

          {/* Pro plan card */}
          <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Pro</span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold">
                NT${interval === "monthly" ? "100" : "800"}
              </span>
              <span className="text-sm text-neutral-400">
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
        </div>
      )}
    </div>
  );
}
