"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Settings2,
  Plus,
  Square,
  Bell,
  BellOff,
  Trash2,
  Pencil,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MS_PER_MINUTE = 60 * 1000;
const CIRCLE_CIRCUMFERENCE = 540;

function formatDuration(ms: number): { minutes: string; seconds: string } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
}

function sendNotification(title: string, body: string) {
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(title, { body, icon: "/icon.svg" });
  }
}

export default function PosturePage() {
  const utils = trpc.useUtils();

  const [now, setNow] = useState(() => Date.now());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPosture, setEditingPosture] = useState<{
    id?: string;
    name: string;
    emoji: string;
    maxMinutes: number;
    suggestedBreak: string;
    sortOrder: number;
  } | null>(null);
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const [hasNotified, setHasNotified] = useState(false);

  const { data: definitions, isLoading: defsLoading } =
    trpc.posture.getDefinitions.useQuery();
  const { data: activeSession, isLoading: sessionLoading } =
    trpc.posture.getActiveSession.useQuery();
  const { data: config } = trpc.posture.getConfig.useQuery();
  const { data: history } = trpc.posture.getHistory.useQuery({ limit: 20 });

  const switchPosture = trpc.posture.switchPosture.useMutation({
    onSuccess: () => {
      utils.posture.getActiveSession.invalidate();
      utils.posture.getHistory.invalidate();
      setSnoozedUntil(null);
      setHasNotified(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const stopSession = trpc.posture.stopSession.useMutation({
    onSuccess: () => {
      utils.posture.getActiveSession.invalidate();
      utils.posture.getHistory.invalidate();
      setSnoozedUntil(null);
      setHasNotified(false);
      toast.success("已停止追蹤");
    },
    onError: (err) => toast.error(err.message),
  });

  const upsertDefinition = trpc.posture.upsertDefinition.useMutation({
    onSuccess: () => {
      utils.posture.getDefinitions.invalidate();
      setEditDialogOpen(false);
      setEditingPosture(null);
      toast.success("已儲存");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteDefinition = trpc.posture.deleteDefinition.useMutation({
    onSuccess: () => {
      utils.posture.getDefinitions.invalidate();
      toast.success("已刪除");
    },
    onError: (err) => toast.error(err.message),
  });

  const upsertConfig = trpc.posture.upsertConfig.useMutation({
    onSuccess: () => {
      utils.posture.getConfig.invalidate();
      toast.success("設定已儲存");
    },
    onError: (err) => toast.error(err.message),
  });

  const markReminded = trpc.posture.markReminded.useMutation();

  // Timer tick
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Reminder logic
  const elapsedMs = activeSession
    ? now - new Date(activeSession.startedAt).getTime()
    : 0;
  const maxMs = activeSession
    ? activeSession.maxMinutes * MS_PER_MINUTE
    : 0;
  const isOvertime = elapsedMs > maxMs && maxMs > 0;
  const progressPercent =
    maxMs > 0 ? Math.min((elapsedMs / maxMs) * 100, 100) : 0;
  const elapsed = formatDuration(elapsedMs);
  const remaining = formatDuration(Math.max(0, maxMs - elapsedMs));

  const isSnoozed = snoozedUntil !== null && now < snoozedUntil;
  const shouldRemind =
    isOvertime &&
    config?.reminderEnabled !== false &&
    !isSnoozed;

  // Send browser notification when overtime
  useEffect(() => {
    if (shouldRemind && activeSession && !hasNotified) {
      sendNotification(
        `${activeSession.postureEmoji} 該換姿勢了！`,
        `你已經維持「${activeSession.postureName}」超過 ${activeSession.maxMinutes} 分鐘。${activeSession.suggestedBreak}`
      );
      markReminded.mutate({ id: activeSession.id });
      setHasNotified(true);
    }
  }, [shouldRemind, activeSession, hasNotified]);

  const handleSnooze = useCallback(() => {
    const snoozeMs = (config?.snoozeMinutes ?? 10) * MS_PER_MINUTE;
    setSnoozedUntil(Date.now() + snoozeMs);
    toast(`已延後 ${config?.snoozeMinutes ?? 10} 分鐘提醒`);
  }, [config?.snoozeMinutes]);

  const handleSwitchPosture = (postureId: string) => {
    switchPosture.mutate({ postureId });
  };

  const handleEditPosture = (posture?: NonNullable<typeof definitions>[number]) => {
    if (posture) {
      setEditingPosture({
        id: posture.id,
        name: posture.name,
        emoji: posture.emoji,
        maxMinutes: posture.maxMinutes,
        suggestedBreak: posture.suggestedBreak,
        sortOrder: posture.sortOrder,
      });
    } else {
      setEditingPosture({
        name: "",
        emoji: "🧘",
        maxMinutes: 30,
        suggestedBreak: "變換姿勢、活動一下",
        sortOrder: definitions?.length ?? 0,
      });
    }
    setEditDialogOpen(true);
  };

  const handleSavePosture = () => {
    if (!editingPosture) return;
    upsertDefinition.mutate(editingPosture);
  };

  const isLoading = defsLoading || sessionLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light tracking-wide">姿勢提醒</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-neutral-400 hover:text-foreground transition-colors"
        >
          <Settings2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Active session info */}
      {activeSession && (
        <div className="text-center">
          <p className="text-sm font-light text-neutral-400">
            {activeSession.postureEmoji} {activeSession.postureName}
            <span className="mx-2">·</span>
            上限 {activeSession.maxMinutes} 分鐘
          </p>
        </div>
      )}

      {/* Timer Circle */}
      <div className="flex flex-col items-center py-4">
        <div className="relative flex h-48 w-48 items-center justify-center">
          <svg className="h-48 w-48 -rotate-90" viewBox="0 0 192 192">
            <circle
              cx="96"
              cy="96"
              r="86"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-neutral-200 dark:text-neutral-800"
            />
            <circle
              cx="96"
              cy="96"
              r="86"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${(progressPercent / 100) * CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE - (progressPercent / 100) * CIRCLE_CIRCUMFERENCE}`}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${
                isOvertime
                  ? "text-red-500"
                  : progressPercent > 80
                    ? "text-amber-500"
                    : activeSession
                      ? "text-green-500"
                      : "text-neutral-300 dark:text-neutral-700"
              }`}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            {activeSession ? (
              <>
                <span className="text-2xl mb-1">{activeSession.postureEmoji}</span>
                <span className="text-3xl font-extralight tabular-nums tracking-wider">
                  {elapsed.minutes}:{elapsed.seconds}
                </span>
                <p className="text-xs font-light text-neutral-400 mt-1">
                  {isOvertime
                    ? "已超時！請換姿勢"
                    : `剩餘 ${remaining.minutes}:${remaining.seconds}`}
                </p>
              </>
            ) : (
              <>
                <span className="text-3xl mb-2">🧘</span>
                <span className="text-sm font-light text-neutral-400">
                  選擇姿勢開始追蹤
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overtime alert banner */}
      {shouldRemind && activeSession && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center space-y-2">
          <p className="text-sm font-light text-red-600 dark:text-red-400">
            {activeSession.suggestedBreak}
          </p>
          <button
            onClick={handleSnooze}
            className="text-xs font-light text-neutral-500 hover:text-foreground transition-colors underline underline-offset-2"
          >
            延後 {config?.snoozeMinutes ?? 10} 分鐘
          </button>
        </div>
      )}

      {/* Posture quick-switch buttons */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          切換姿勢
        </p>
        <div className="grid grid-cols-3 gap-2">
          {definitions?.map((def) => {
            const isActive = activeSession?.postureId === def.id;
            return (
              <button
                key={def.id}
                onClick={() => handleSwitchPosture(def.id)}
                disabled={switchPosture.isPending}
                className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-sm font-light transition-all disabled:opacity-50 ${
                  isActive
                    ? "border-green-500/40 bg-green-500/5 text-green-600 dark:text-green-400"
                    : "border-black/[0.06] dark:border-white/[0.06] text-neutral-500 hover:border-foreground/20"
                }`}
              >
                <span className="text-lg">{def.emoji}</span>
                <span className="text-[11px]">{def.name}</span>
                <span className="text-[9px] text-neutral-400">
                  {def.maxMinutes} 分鐘
                </span>
              </button>
            );
          })}
          <button
            onClick={() => handleEditPosture()}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-lg border border-dashed border-black/[0.06] dark:border-white/[0.06] text-neutral-400 hover:border-foreground/20 transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-[11px]">新增</span>
          </button>
        </div>
      </div>

      {/* Stop button */}
      {activeSession && (
        <div className="flex justify-center">
          <button
            onClick={() => stopSession.mutate()}
            disabled={stopSession.isPending}
            className="flex items-center gap-2 px-6 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-500 text-sm font-light transition-all hover:border-foreground/30 disabled:opacity-50"
          >
            <Square className="h-3.5 w-3.5" strokeWidth={1.5} />
            {stopSession.isPending ? "停止中..." : "停止追蹤"}
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

      {/* History */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          今日紀錄
        </p>
        {history && history.length > 0 ? (
          <div className="space-y-0">
            {history.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-3 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{log.postureEmoji}</span>
                  <div>
                    <p className="text-sm font-light">
                      {log.postureName}
                      {log.durationMinutes != null && (
                        <span className="text-neutral-400 ml-2">
                          {log.durationMinutes} 分鐘
                        </span>
                      )}
                      {!log.endedAt && (
                        <span className="text-green-500 ml-2 text-xs">進行中</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400 tabular-nums">
                      {formatTime(log.startedAt)}
                      {log.endedAt && ` — ${formatTime(log.endedAt)}`}
                    </p>
                  </div>
                </div>
                {log.wasReminded && (
                  <Bell className="h-3 w-3 text-amber-500" strokeWidth={1.5} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-light text-neutral-300 dark:text-neutral-700">
            還沒有姿勢紀錄
          </p>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogHeader>
          <DialogTitle>姿勢提醒設定</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-5">
          {/* Reminder toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config?.reminderEnabled !== false ? (
                <Bell className="h-4 w-4 text-green-500" strokeWidth={1.5} />
              ) : (
                <BellOff className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
              )}
              <span className="text-sm font-light">超時提醒</span>
            </div>
            <button
              onClick={() =>
                upsertConfig.mutate({
                  reminderEnabled: config?.reminderEnabled === false,
                  snoozeMinutes: config?.snoozeMinutes ?? 10,
                })
              }
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                config?.reminderEnabled !== false
                  ? "bg-green-500"
                  : "bg-neutral-300 dark:bg-neutral-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  config?.reminderEnabled !== false
                    ? "translate-x-5"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Snooze duration */}
          <div className="space-y-2">
            <label className="text-sm font-light text-neutral-500">
              延後提醒時間（分鐘）
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  onClick={() =>
                    upsertConfig.mutate({
                      reminderEnabled: config?.reminderEnabled !== false,
                      snoozeMinutes: mins,
                    })
                  }
                  className={`flex-1 py-2 rounded-lg border text-sm font-light transition-all ${
                    (config?.snoozeMinutes ?? 10) === mins
                      ? "border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/5"
                      : "border-black/[0.06] dark:border-white/[0.06] text-neutral-500 hover:border-foreground/20"
                  }`}
                >
                  {mins}
                </button>
              ))}
            </div>
          </div>

          {/* Manage postures */}
          <div className="space-y-2">
            <label className="text-sm font-light text-neutral-500">
              管理姿勢類型
            </label>
            <div className="space-y-0">
              {definitions?.map((def) => (
                <div
                  key={def.id}
                  className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span>{def.emoji}</span>
                    <span className="text-sm font-light">{def.name}</span>
                    <span className="text-xs text-neutral-400">
                      {def.maxMinutes}分鐘
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditPosture(def)}
                      className="text-neutral-400 hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => deleteDefinition.mutate({ id: def.id })}
                      disabled={deleteDefinition.isPending}
                      className="text-neutral-300 dark:text-neutral-700 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setSettingsOpen(false);
                handleEditPosture();
              }}
              className="w-full mt-2 py-2 text-sm font-light text-neutral-500 border border-dashed border-black/[0.06] dark:border-white/[0.06] rounded-lg hover:border-foreground/20 transition-all"
            >
              + 新增姿勢
            </button>
          </div>
        </div>
      </Dialog>

      {/* Edit Posture Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingPosture?.id ? "編輯姿勢" : "新增姿勢"}
          </DialogTitle>
        </DialogHeader>
        {editingPosture && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400">圖示</label>
                <input
                  type="text"
                  value={editingPosture.emoji}
                  onChange={(e) =>
                    setEditingPosture({ ...editingPosture, emoji: e.target.value })
                  }
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-center text-lg focus:outline-none focus:ring-1 focus:ring-green-500"
                  maxLength={4}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-400">名稱</label>
                <input
                  type="text"
                  value={editingPosture.name}
                  onChange={(e) =>
                    setEditingPosture({ ...editingPosture, name: e.target.value })
                  }
                  placeholder="例：打電動"
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-green-500"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-neutral-400">
                上限時間（分鐘）
              </label>
              <input
                type="number"
                value={editingPosture.maxMinutes}
                onChange={(e) =>
                  setEditingPosture({
                    ...editingPosture,
                    maxMinutes: parseInt(e.target.value) || 30,
                  })
                }
                min={5}
                max={480}
                className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-neutral-400">
                超時建議動作
              </label>
              <input
                type="text"
                value={editingPosture.suggestedBreak}
                onChange={(e) =>
                  setEditingPosture({
                    ...editingPosture,
                    suggestedBreak: e.target.value,
                  })
                }
                placeholder="例：站起來走動 2 分鐘"
                className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-green-500"
                maxLength={100}
              />
            </div>

            <button
              onClick={handleSavePosture}
              disabled={
                upsertDefinition.isPending ||
                !editingPosture.name ||
                !editingPosture.emoji
              }
              className="w-full rounded-lg bg-green-500 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
            >
              {upsertDefinition.isPending ? "儲存中..." : "儲存"}
            </button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
