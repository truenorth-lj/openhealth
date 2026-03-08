"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Play,
  Clock,
  Dumbbell,
  Trophy,
  ChevronRight,
  BarChart3,
  Trash2,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { startWorkout } from "@/server/actions/workout";
import { formatDuration } from "@/hooks/use-workout-timer";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteWorkoutTemplate } from "@/server/actions/workout";

export default function WorkoutPage() {
  const router = useRouter();
  const { isAuthenticated, showLoginDialog, setShowLoginDialog } =
    useAuthGuard();

  const { data: activeWorkout } = trpc.workout.getActive.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: templates } = trpc.workout.getTemplates.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: history } = trpc.workout.getHistory.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );

  const [starting, setStarting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleQuickStart = async () => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    setStarting(true);
    try {
      await startWorkout({});
      router.push(`/workout/active`);
    } catch {
      toast.error("啟動訓練失敗");
    } finally {
      setStarting(false);
    }
  };

  const handleStartFromTemplate = async (templateId: string, name: string) => {
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }
    setStarting(true);
    try {
      await startWorkout({ templateId, name });
      router.push(`/workout/active`);
    } catch {
      toast.error("啟動訓練失敗");
    } finally {
      setStarting(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteWorkoutTemplate({ templateId });
      toast.success("已刪除模板");
      setDeleteConfirm(null);
      router.refresh();
    } catch {
      toast.error("刪除失敗");
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("zh-TW", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light tracking-wide">重訓記錄</h1>
        <Link
          href="/workout/stats"
          className="text-neutral-400 hover:text-foreground transition-colors"
        >
          <BarChart3 className="h-5 w-5" strokeWidth={1.5} />
        </Link>
      </div>

      {/* Active workout banner */}
      {activeWorkout && (
        <Link
          href="/workout/active"
          className="block rounded-lg border border-primary/30 bg-primary/5 p-4 transition-all hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Play className="h-4 w-4 text-primary" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-medium">{activeWorkout.name}</p>
                <p className="text-xs text-neutral-400">進行中</p>
              </div>
            </div>
            <ChevronRight
              className="h-5 w-5 text-neutral-400"
              strokeWidth={1.5}
            />
          </div>
        </Link>
      )}

      {/* Quick start */}
      <button
        onClick={handleQuickStart}
        disabled={starting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-primary text-white text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        {starting ? "啟動中..." : "開始空白訓練"}
      </button>

      {/* Templates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            訓練模板
          </p>
          <Link
            href="/workout/templates"
            className="text-xs text-neutral-400 hover:text-foreground transition-colors"
          >
            管理
          </Link>
        </div>

        {templates && templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-3 transition-all hover:border-foreground/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light truncate">{t.name}</p>
                  <p className="text-xs text-neutral-400 truncate">
                    {t.exerciseNames.join("、") || "無動作"}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => {
                      setDeleteConfirm(t.id);
                    }}
                    className="p-1.5 text-neutral-300 dark:text-neutral-700 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => handleStartFromTemplate(t.id, t.name)}
                    disabled={starting}
                    className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    開始
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-light text-neutral-300 dark:text-neutral-700">
            還沒有訓練模板
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

      {/* Recent history */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            最近訓練
          </p>
          <Link
            href="/workout/history"
            className="text-xs text-neutral-400 hover:text-foreground transition-colors"
          >
            查看全部
          </Link>
        </div>

        {history?.items && history.items.length > 0 ? (
          <div className="space-y-0">
            {history.items.map((w) => (
              <Link
                key={w.id}
                href={`/workout/history/${w.id}`}
                className="flex items-center justify-between py-3 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors -mx-1 px-1 rounded"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-light truncate">
                      {w.name}
                    </span>
                    {w.prCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                        <Trophy className="h-3 w-3" strokeWidth={2} />
                        {w.prCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-neutral-400">
                      {formatDate(w.startedAt)}
                    </span>
                    <span className="text-xs text-neutral-400 tabular-nums">
                      <Clock className="h-3 w-3 inline mr-0.5" strokeWidth={1.5} />
                      {w.durationSec ? formatDuration(w.durationSec) : "-"}
                    </span>
                    <span className="text-xs text-neutral-400 tabular-nums">
                      <Dumbbell className="h-3 w-3 inline mr-0.5" strokeWidth={1.5} />
                      {w.exerciseCount} 動作
                    </span>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <span className="text-sm font-light tabular-nums text-primary">
                    {Math.round(w.totalVolume).toLocaleString()} kg
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm font-light text-neutral-300 dark:text-neutral-700">
            還沒有訓練紀錄
          </p>
        )}
      </div>

      {/* Delete template confirm dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogHeader>
          <DialogTitle>確認刪除模板？</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-neutral-500">刪除後無法復原。</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm font-light"
            >
              取消
            </button>
            <button
              onClick={() => deleteConfirm && handleDeleteTemplate(deleteConfirm)}
              className="flex-1 py-2 rounded-lg bg-destructive text-white text-sm font-medium"
            >
              刪除
            </button>
          </div>
        </div>
      </Dialog>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
}
