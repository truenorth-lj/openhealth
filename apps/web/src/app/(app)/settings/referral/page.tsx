"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { applyReferralCode, customizeReferralCode } from "@/server/actions/referral";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, Pencil, Users, Gift, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ReferralPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const isLoggedIn = !!session?.user;

  const { data: codeData, refetch: refetchCode, isError: codeError } = trpc.referral.getMyCode.useQuery(
    undefined,
    { enabled: isLoggedIn }
  );
  const { data: stats, refetch: refetchStats } = trpc.referral.getStats.useQuery(
    undefined,
    { enabled: isLoggedIn }
  );

  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customError, setCustomError] = useState("");
  const [customLoading, setCustomLoading] = useState(false);

  const [referralInput, setReferralInput] = useState("");
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const handleCopy = async () => {
    if (!codeData?.code) return;
    await navigator.clipboard.writeText(codeData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomize = async () => {
    if (!customCode.trim()) return;
    setCustomLoading(true);
    setCustomError("");
    try {
      const result = await customizeReferralCode({ code: customCode.trim() });
      if (result.success) {
        setEditing(false);
        setCustomCode("");
        refetchCode();
        router.refresh();
      } else {
        setCustomError(result.error || "自訂失敗");
      }
    } catch {
      setCustomError("自訂失敗，請稍後再試");
    } finally {
      setCustomLoading(false);
    }
  };

  const handleApply = async () => {
    if (!referralInput.trim()) return;
    setApplyLoading(true);
    setApplyError("");
    setApplySuccess(false);
    try {
      const result = await applyReferralCode({ code: referralInput.trim() });
      if (result.success) {
        setApplySuccess(true);
        setReferralInput("");
        refetchStats();
        router.refresh();
      } else {
        setApplyError(result.error || "套用失敗");
      }
    } catch {
      setApplyError("套用失敗，請稍後再試");
    } finally {
      setApplyLoading(false);
    }
  };

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
        <h1 className="text-xl font-light tracking-wide">推薦碼</h1>
      </div>

      {/* Auth guard */}
      {!sessionLoading && !isLoggedIn && (
        <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 text-center text-sm text-neutral-400">
          請先登入以查看推薦碼。
        </div>
      )}

      {sessionLoading && (
        <div className="text-center text-sm text-neutral-400 py-8">載入中...</div>
      )}

      {isLoggedIn && (
      <>
      {/* My referral code */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          我的推薦碼
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-black/[0.06] dark:border-white/[0.06] px-4 py-3 text-center font-mono text-lg tracking-[0.2em]">
            {codeError ? "無法載入" : codeData?.code ?? "載入中..."}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            disabled={!codeData?.code}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" strokeWidth={1.5} />
            ) : (
              <Copy className="h-4 w-4" strokeWidth={1.5} />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setEditing(!editing);
              setCustomCode(codeData?.code ?? "");
              setCustomError("");
            }}
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>

        {editing && (
          <div className="space-y-2">
            <Input
              placeholder="輸入自訂推薦碼（4-12 字元）"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              maxLength={12}
            />
            {customError && (
              <p className="text-xs text-destructive">{customError}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCustomize}
                disabled={customLoading || !customCode.trim()}
              >
                {customLoading ? "儲存中..." : "儲存"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setCustomError("");
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Apply referral code (only if not already referred) */}
      {stats && !stats.wasReferred && !applySuccess && (
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            輸入推薦碼
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="輸入朋友的推薦碼"
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              maxLength={12}
            />
            <Button
              onClick={handleApply}
              disabled={applyLoading || !referralInput.trim()}
            >
              {applyLoading ? "送出中..." : "送出"}
            </Button>
          </div>
          {applyError && (
            <p className="text-xs text-destructive">{applyError}</p>
          )}
        </div>
      )}

      {applySuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
          推薦碼套用成功！你獲得 14 天 Pro 試用，推薦人獲得 30 天免費。
        </div>
      )}

      {stats?.wasReferred && !applySuccess && (
        <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-3 text-sm text-neutral-400">
          你已透過推薦碼加入。
        </div>
      )}

      {/* Trial / Free days info */}
      {stats && (stats.totalFreeDaysEarned > 0 || stats.trialExpiresAt) && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/30 p-4 space-y-1">
          {stats.totalFreeDaysEarned > 0 && (
            <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5" strokeWidth={1.5} />
              已累計獲得 {stats.totalFreeDaysEarned} 天免費天數
            </p>
          )}
          {stats.trialExpiresAt && new Date(stats.trialExpiresAt) > new Date() && (
            <p className="text-xs text-green-600 dark:text-green-400">
              試用到期：{new Date(stats.trialExpiresAt).toLocaleDateString("zh-TW")}
            </p>
          )}
        </div>
      )}

      {/* Rewards card */}
      <Link
        href="/settings/referral/rewards"
        className="flex items-center justify-between rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      >
        <div className="space-y-0.5">
          <p className="text-sm font-medium">分潤獎勵</p>
          <p className="text-xs text-neutral-400">
            查看分潤明細、提領餘額
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
      </Link>

      {/* Referral list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            推薦列表
          </p>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <Users className="h-3 w-3" strokeWidth={1.5} />
            <span>{stats?.referralCount ?? 0} 人</span>
          </div>
        </div>

        {stats?.referralList && stats.referralList.length > 0 ? (
          <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
            {stats.referralList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] px-1 py-3"
              >
                <div className="space-y-0.5">
                  <span className="text-sm font-light">{item.name}</span>
                  <span className={`block text-xs ${
                    item.status === "paid" ? "text-green-600" :
                    item.status === "trial" ? "text-amber-500" :
                    "text-neutral-400"
                  }`}>
                    {item.status === "paid" ? "已付費" :
                     item.status === "trial" ? "試用中" :
                     "已註冊"}
                  </span>
                </div>
                <span className="text-xs text-neutral-400">
                  {new Date(item.joinedAt).toLocaleDateString("zh-TW")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400 dark:text-neutral-600">
            尚無推薦記錄，分享你的推薦碼給朋友吧！
          </p>
        )}
      </div>
      </>
      )}
    </div>
  );
}
