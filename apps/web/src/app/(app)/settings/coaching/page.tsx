"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { connectToCoach, disconnectFromCoach } from "@/server/actions/coaching";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, X } from "lucide-react";

export default function CoachingSettingsPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data: coaches, isLoading } = trpc.coach.getMyCoaches.useQuery();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const result = await connectToCoach({ code: code.trim() });
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("已成功加入教練");
        setCode("");
        router.refresh();
      }
    } catch {
      toast.error("發生錯誤");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (coachId: string) => {
    try {
      await disconnectFromCoach(coachId);
      toast.success("已取消連結");
      router.refresh();
    } catch {
      toast.error("發生錯誤");
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-light tracking-wide">我的教練</h1>

      {/* Connect form */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          加入教練
        </p>
        <form onSubmit={handleConnect} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="輸入教練碼"
            maxLength={12}
            className="flex-1 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2.5 text-sm font-light font-mono tracking-widest placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-foreground/20"
          />
          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="rounded-lg border border-foreground/20 px-4 py-2.5 text-sm font-light transition-all hover:bg-foreground/5 disabled:opacity-50"
          >
            {submitting ? "加入中..." : "加入"}
          </button>
        </form>
      </div>

      {/* My coaches */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          已連結教練
        </p>

        {isLoading ? (
          <p className="text-sm text-neutral-400 py-4">載入中...</p>
        ) : !coaches?.length ? (
          <p className="text-sm text-neutral-400 font-light py-4">
            尚未加入任何教練
          </p>
        ) : (
          <div className="space-y-2">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="flex items-center justify-between rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.06]">
                    <User
                      className="h-5 w-5 text-neutral-400"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-light">{coach.coachName}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-600">
                      {coach.startDate} 起
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(coach.coachId)}
                  className="rounded-lg p-2 text-neutral-400 transition-all hover:text-destructive hover:bg-destructive/10"
                  title="取消連結"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
