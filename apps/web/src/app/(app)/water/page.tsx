"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Droplets, Plus, Undo2, Settings2, Pencil, Trash2, X } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { todayString } from "@open-health/shared/utils";

const DEFAULT_QUICK_AMOUNTS = [150, 250, 350, 500];

function formatTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function isValidGoal(value: string) {
  const n = parseInt(value, 10);
  return !isNaN(n) && n >= 500 && n <= 10000;
}

export default function WaterPage() {
  const today = todayString();
  const utils = trpc.useUtils();

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [containerDialogOpen, setContainerDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<{
    id?: string;
    name: string;
    amountMl: string;
    sortOrder: number;
  } | null>(null);

  const { data: todayData, isLoading } = trpc.water.getToday.useQuery({ date: today });
  const { data: logs } = trpc.water.getLogs.useQuery({ date: today });
  const { data: containers } = trpc.water.getContainers.useQuery();

  const logWater = trpc.water.logWater.useMutation({
    onSuccess: () => {
      utils.water.getToday.invalidate({ date: today });
      utils.water.getLogs.invalidate({ date: today });
    },
  });

  const undoLastLog = trpc.water.undoLastLog.useMutation({
    onSuccess: () => {
      utils.water.getToday.invalidate({ date: today });
      utils.water.getLogs.invalidate({ date: today });
    },
  });

  const setGoal = trpc.water.setGoal.useMutation({
    onSuccess: () => {
      utils.water.getToday.invalidate({ date: today });
      utils.water.getGoal.invalidate();
      setGoalDialogOpen(false);
    },
  });

  const upsertContainer = trpc.water.upsertContainer.useMutation({
    onSuccess: () => {
      utils.water.getContainers.invalidate();
      setEditingContainer(null);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteContainer = trpc.water.deleteContainer.useMutation({
    onSuccess: () => {
      utils.water.getContainers.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const totalMl = todayData?.totalMl ?? 0;
  const goalMl = todayData?.goalMl ?? 2500;
  const percentage = Math.min((totalMl / goalMl) * 100, 100);

  // Use custom containers if any exist, otherwise fall back to defaults
  const hasCustomContainers = containers && containers.length > 0;
  const quickButtons = hasCustomContainers
    ? containers.map((c) => ({ id: c.id, label: c.name, amountMl: c.amountMl }))
    : DEFAULT_QUICK_AMOUNTS.map((ml) => ({ id: String(ml), label: `${ml} ml`, amountMl: ml }));

  const handleOpenGoalDialog = () => {
    setGoalInput(String(goalMl));
    setGoalDialogOpen(true);
  };

  const handleSaveGoal = () => {
    if (!isValidGoal(goalInput)) return;
    setGoal.mutate({ dailyTargetMl: parseInt(goalInput, 10) });
  };

  const handleOpenContainerDialog = () => {
    setEditingContainer(null);
    setContainerDialogOpen(true);
  };

  const handleEditContainer = (container: { id: string; name: string; amountMl: number; sortOrder: number }) => {
    setEditingContainer({
      id: container.id,
      name: container.name,
      amountMl: String(container.amountMl),
      sortOrder: container.sortOrder,
    });
  };

  const handleAddNew = () => {
    const maxSort = containers?.reduce((max, c) => Math.max(max, c.sortOrder), -1) ?? -1;
    setEditingContainer({
      name: "",
      amountMl: "",
      sortOrder: maxSort + 1,
    });
  };

  const handleSaveContainer = () => {
    if (!editingContainer) return;
    const amountMl = parseInt(editingContainer.amountMl, 10);
    if (!editingContainer.name.trim() || isNaN(amountMl) || amountMl < 1 || amountMl > 5000) return;

    upsertContainer.mutate({
      id: editingContainer.id,
      name: editingContainer.name.trim(),
      amountMl,
      sortOrder: editingContainer.sortOrder,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-light tracking-wide">水分追蹤</h1>

      {/* Circular progress */}
      <div className="flex flex-col items-center py-6">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="h-40 w-40 -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-neutral-200 dark:text-neutral-800"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray={`${percentage * 4.4} ${440 - percentage * 4.4}`}
              strokeLinecap="round"
              className="text-blue-500 transition-all duration-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <Droplets className="h-5 w-5 text-blue-500 mb-1" strokeWidth={1.5} />
            <span className="text-3xl font-extralight tabular-nums">{totalMl}</span>
            <button
              onClick={handleOpenGoalDialog}
              className="text-xs font-light text-neutral-400 dark:text-neutral-600 hover:text-blue-500 transition-colors cursor-pointer"
            >
              / {goalMl} ml
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm font-light text-neutral-400">
          {percentage >= 100
            ? "已達到今日目標！"
            : `還需 ${goalMl - totalMl} ml`}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

      {/* Quick Add */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            快速新增
          </p>
          <button
            onClick={handleOpenContainerDialog}
            className="text-neutral-400 hover:text-foreground transition-colors"
            title="管理容器"
          >
            <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <div className={`grid gap-2 ${quickButtons.length <= 2 ? "grid-cols-2" : quickButtons.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
          {quickButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => logWater.mutate({ date: today, amountMl: btn.amountMl })}
              disabled={logWater.isPending}
              className="flex flex-col items-center gap-1 py-3 border border-black/[0.06] dark:border-white/[0.06] rounded-lg text-sm font-light transition-all duration-300 hover:border-foreground/20 disabled:opacity-50"
            >
              <Plus className="h-3 w-3 text-neutral-400" strokeWidth={1.5} />
              {hasCustomContainers ? (
                <>
                  <span className="text-xs truncate max-w-full px-1">{btn.label}</span>
                  <span className="text-[10px] text-neutral-400">{btn.amountMl} ml</span>
                </>
              ) : (
                <span>{btn.label}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => undoLastLog.mutate({ date: today })}
            disabled={undoLastLog.isPending || totalMl === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-light text-neutral-400 transition-all duration-300 hover:text-foreground disabled:opacity-30"
          >
            <Undo2 className="h-3 w-3" strokeWidth={1.5} />
            復原上一筆
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06]" />

      {/* Log History */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          今日紀錄
        </p>
        {logs && logs.length > 0 ? (
          <div className="space-y-0">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0"
              >
                <span className="text-sm font-light text-neutral-400 tabular-nums">
                  {formatTime(log.loggedAt)}
                </span>
                <span className="text-sm font-light">{log.amountMl} ml</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-light text-neutral-300 dark:text-neutral-700">
            今天還沒有喝水紀錄
          </p>
        )}
      </div>

      {/* Goal Setting Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogHeader>
          <DialogTitle>設定每日目標</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-light text-neutral-500">每日飲水目標 (ml)</label>
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              min={500}
              max={10000}
              step={100}
              className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {goalInput && !isValidGoal(goalInput) && (
              <p className="mt-1 text-xs text-red-500">請輸入 500 - 10000 之間的數值</p>
            )}
            {(!goalInput || isValidGoal(goalInput)) && (
              <p className="mt-1 text-xs text-neutral-400">建議範圍：500 - 10000 ml</p>
            )}
          </div>
          <button
            onClick={handleSaveGoal}
            disabled={setGoal.isPending || !isValidGoal(goalInput)}
            className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {setGoal.isPending ? "儲存中..." : "儲存"}
          </button>
        </div>
      </Dialog>

      {/* Container Management Dialog */}
      <Dialog open={containerDialogOpen} onOpenChange={(open) => { setContainerDialogOpen(open); if (!open) setEditingContainer(null); }}>
        <DialogHeader>
          <DialogTitle>管理自訂容器</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {/* Existing containers list */}
          {containers && containers.length > 0 && !editingContainer && (
            <div className="space-y-2">
              {containers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 px-3 border border-black/[0.06] dark:border-white/[0.06] rounded-lg"
                >
                  <div>
                    <span className="text-sm font-light">{c.name}</span>
                    <span className="text-xs text-neutral-400 ml-2">{c.amountMl} ml</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditContainer(c)}
                      className="text-neutral-400 hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => deleteContainer.mutate({ id: c.id })}
                      disabled={deleteContainer.isPending}
                      className="text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit form */}
          {editingContainer ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {editingContainer.id ? "編輯容器" : "新增容器"}
                </p>
                <button onClick={() => setEditingContainer(null)} className="text-neutral-400 hover:text-foreground">
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              <div>
                <label className="text-sm font-light text-neutral-500">名稱</label>
                <input
                  type="text"
                  value={editingContainer.name}
                  onChange={(e) => setEditingContainer({ ...editingContainer, name: e.target.value })}
                  placeholder="例：馬克杯"
                  maxLength={20}
                  className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-light text-neutral-500">容量 (ml)</label>
                <input
                  type="number"
                  value={editingContainer.amountMl}
                  onChange={(e) => setEditingContainer({ ...editingContainer, amountMl: e.target.value })}
                  min={1}
                  max={5000}
                  placeholder="例：300"
                  className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSaveContainer}
                disabled={upsertContainer.isPending || !editingContainer.name.trim() || !editingContainer.amountMl}
                className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              >
                {upsertContainer.isPending ? "儲存中..." : "儲存"}
              </button>
            </div>
          ) : (
            /* Add button */
            (containers?.length ?? 0) < 4 && (
              <button
                onClick={handleAddNew}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-black/10 dark:border-white/10 rounded-lg text-sm font-light text-neutral-400 hover:text-foreground hover:border-foreground/20 transition-all"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                新增容器
              </button>
            )
          )}

          {!editingContainer && (
            <p className="text-xs text-neutral-400 text-center">
              最多可建立 4 個自訂容器，建立後會取代預設按鈕
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
