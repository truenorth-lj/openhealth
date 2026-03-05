"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { REFERRAL } from "@open-health/shared/constants";

function formatNtd(cents: number) {
  return `NT$${Math.floor(cents / 100).toLocaleString()}`;
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "待確認";
    case "confirmed":
      return "已確認";
    case "paid":
      return "已提領";
    case "clawed_back":
      return "已扣回";
    default:
      return status;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "pending":
      return "text-amber-500";
    case "confirmed":
      return "text-green-600";
    case "paid":
      return "text-blue-500";
    case "clawed_back":
      return "text-red-500";
    default:
      return "text-neutral-400";
  }
}

export default function RewardsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const isLoggedIn = !!session?.user;

  const { data: stats } = trpc.referral.getRewardStats.useQuery(undefined, {
    enabled: isLoggedIn,
  });
  const { data: history } = trpc.referral.getRewardHistory.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isLoggedIn }
  );

  const utils = trpc.useUtils();
  const payoutMutation = trpc.referral.requestPayout.useMutation({
    onSuccess: () => {
      utils.referral.getRewardStats.invalidate();
      utils.referral.getRewardHistory.invalidate();
    },
  });

  const [payoutError, setPayoutError] = useState("");

  const handlePayout = async () => {
    setPayoutError("");
    const result = await payoutMutation.mutateAsync({
      method: "subscription_credit",
    });
    if (!result.success) {
      setPayoutError(result.error);
    }
  };

  const canWithdraw =
    (stats?.withdrawableAmount ?? 0) >= REFERRAL.MIN_PAYOUT_CENTS;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings/referral"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-light tracking-wide">分潤獎勵</h1>
      </div>

      {sessionLoading && (
        <div className="text-center text-sm text-neutral-400 py-8">
          載入中...
        </div>
      )}

      {!sessionLoading && !isLoggedIn && (
        <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 text-center text-sm text-neutral-400">
          請先登入以查看分潤獎勵。
        </div>
      )}

      {isLoggedIn && stats && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <DollarSign className="h-3 w-3" strokeWidth={1.5} />
                <span>累計分潤</span>
              </div>
              <p className="text-lg font-light">
                {formatNtd(
                  stats.totalPending + stats.totalConfirmed + stats.totalPaid
                )}
              </p>
            </div>
            <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <CheckCircle className="h-3 w-3" strokeWidth={1.5} />
                <span>可提領</span>
              </div>
              <p className="text-lg font-light">
                {formatNtd(stats.withdrawableAmount)}
              </p>
            </div>
            <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                <span>待確認</span>
              </div>
              <p className="text-lg font-light">
                {formatNtd(stats.totalPending)}
              </p>
            </div>
            <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <DollarSign className="h-3 w-3" strokeWidth={1.5} />
                <span>已付費推薦</span>
              </div>
              <p className="text-lg font-light">
                {stats.payingRefereeCount} 人
              </p>
            </div>
          </div>

          {/* Payout section */}
          <div className="space-y-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
              提領
            </p>
            <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-3">
              <p className="text-sm text-neutral-500">
                分潤於付款後 90 天確認，累計達 NT$500 即可提領。目前僅支援折抵訂閱費用。
              </p>
              <Button
                onClick={handlePayout}
                disabled={!canWithdraw || payoutMutation.isPending}
                className="w-full"
              >
                {payoutMutation.isPending
                  ? "處理中..."
                  : canWithdraw
                    ? `提領 ${formatNtd(stats.withdrawableAmount)}（折抵訂閱）`
                    : "餘額不足 NT$500"}
              </Button>
              {payoutError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {payoutError}
                </p>
              )}
              {payoutMutation.isSuccess && payoutMutation.data.success && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  提領申請已送出，將折抵下期訂閱費用。
                </p>
              )}
            </div>
          </div>

          {/* History */}
          <div className="space-y-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
              獎勵明細
            </p>
            {history && history.length > 0 ? (
              <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
                {history.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] px-1 py-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-light">
                        {reward.type === "free_days"
                          ? `免費 ${reward.freeDays} 天`
                          : `分潤 ${formatNtd(reward.amountNtd ?? 0)}`}
                      </p>
                      {reward.subscriptionMonth && (
                        <p className="text-xs text-neutral-400">
                          {reward.subscriptionMonth}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className={`text-xs ${statusColor(reward.status)}`}>
                        {statusLabel(reward.status)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(reward.createdAt).toLocaleDateString("zh-TW")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 dark:text-neutral-600">
                尚無獎勵記錄。推薦朋友加入並付費訂閱後即可獲得 25% 分潤。
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
