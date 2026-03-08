"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Check,
  Trash2,
  Search,
  Timer,
  ChevronDown,
  ChevronUp,
  Save,
  Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { LoginDialog } from "@/components/auth/login-dialog";
import {
  useWorkoutTimerStore,
  useWorkoutTimerTick,
  formatDuration,
} from "@/hooks/use-workout-timer";
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  logSet,
  removeSet,
  finishWorkout,
  discardWorkout,
  saveWorkoutAsTemplate,
} from "@/server/actions/workout";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  EXERCISE_CATEGORIES,
  EXERCISE_CATEGORY_LABELS,
  REST_TIMER_OPTIONS,
} from "@open-health/shared/constants";

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { isAuthenticated, showLoginDialog, setShowLoginDialog } =
    useAuthGuard();

  const { data: workout, isLoading } = trpc.workout.getActive.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: false }
  );

  const timerStore = useWorkoutTimerStore();
  useWorkoutTimerTick();

  // Sync timer with workout
  const startWorkoutTimer = timerStore.startWorkout;
  const isTimerRunning = timerStore.isRunning;
  useEffect(() => {
    if (workout && !isTimerRunning) {
      startWorkoutTimer(workout.id, new Date(workout.startedAt));
    }
  }, [workout?.id, workout?.startedAt, isTimerRunning, startWorkoutTimer]);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: presets } = trpc.exercise.getPresets.useQuery(
    selectedCategory
      ? {
          category: selectedCategory as
            | "cardio"
            | "strength"
            | "flexibility"
            | "sport"
            | "other",
        }
      : {},
    { enabled: showAddExercise }
  );
  const { data: searchResults } = trpc.exercise.searchExercises.useQuery(
    { query: searchQuery },
    { enabled: showAddExercise && searchQuery.length >= 1 }
  );

  const exerciseList = searchQuery.length >= 1 ? searchResults : presets;

  const handleAddExercise = async (exerciseId: string) => {
    if (!workout) return;
    try {
      await addExerciseToWorkout({ workoutId: workout.id, exerciseId });
      setShowAddExercise(false);
      setSearchQuery("");
      utils.workout.getActive.invalidate();
    } catch {
      toast.error("新增動作失敗");
    }
  };

  const handleRemoveExercise = async (workoutExerciseId: string) => {
    try {
      await removeExerciseFromWorkout({ workoutExerciseId });
      utils.workout.getActive.invalidate();
    } catch {
      toast.error("刪除動作失敗");
    }
  };

  const handleLogSet = async (
    workoutExerciseId: string,
    setNumber: number,
    weightKg: number | undefined,
    reps: number | undefined
  ) => {
    try {
      await logSet({ workoutExerciseId, setNumber, weightKg, reps });
      utils.workout.getActive.invalidate();
    } catch {
      toast.error("記錄失敗");
    }
  };

  const handleRemoveSet = async (setId: string) => {
    try {
      await removeSet({ setId });
      utils.workout.getActive.invalidate();
    } catch {
      toast.error("刪除失敗");
    }
  };

  const handleAddSet = async (workoutExerciseId: string, nextSetNumber: number) => {
    try {
      await logSet({ workoutExerciseId, setNumber: nextSetNumber });
      utils.workout.getActive.invalidate();
    } catch {
      toast.error("新增組數失敗");
    }
  };

  const handleFinish = async () => {
    if (!workout) return;
    setSaving(true);
    try {
      await finishWorkout({ workoutId: workout.id });
      timerStore.stopWorkout();
      toast.success("訓練完成！");
      router.push("/workout");
      router.refresh();
    } catch {
      toast.error("完成訓練失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!workout) return;
    try {
      await discardWorkout({ workoutId: workout.id });
      timerStore.stopWorkout();
      toast.success("已取消訓練");
      router.push("/workout");
      router.refresh();
    } catch {
      toast.error("取消失敗");
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!workout || !templateName.trim()) return;
    try {
      await saveWorkoutAsTemplate({
        workoutId: workout.id,
        name: templateName.trim(),
      });
      toast.success("已儲存為模板");
      setShowSaveTemplate(false);
      setTemplateName("");
    } catch {
      toast.error("儲存失敗");
    }
  };

  const handleStartRest = (seconds: number) => {
    timerStore.startRestTimer(seconds);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-sm text-neutral-400">沒有進行中的訓練</p>
        <button
          onClick={() => router.push("/workout")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          返回重訓記錄
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-light">{workout.name}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
            <span className="text-sm font-light text-primary tabular-nums">
              {formatDuration(timerStore.elapsedSeconds)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveTemplate(true)}
            className="p-2 text-neutral-400 hover:text-foreground transition-colors"
            title="儲存為模板"
          >
            <Save className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            完成
          </button>
        </div>
      </div>

      {/* Rest timer overlay */}
      {timerStore.restTimer && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-500" strokeWidth={2} />
              <span className="text-sm font-medium text-blue-500">
                休息中
              </span>
            </div>
            <button
              onClick={() => timerStore.cancelRestTimer()}
              className="text-xs text-neutral-400 hover:text-foreground"
            >
              跳過
            </button>
          </div>
          <div className="mt-2 text-center">
            <span className="text-4xl font-extralight tabular-nums text-blue-500">
              {formatDuration(timerStore.restTimer.remaining)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 rounded-full bg-blue-500/20 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
              style={{
                width: `${(timerStore.restTimer.remaining / timerStore.restTimer.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Rest timer quick buttons */}
      {!timerStore.restTimer && (
        <div className="flex gap-1.5">
          {REST_TIMER_OPTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => handleStartRest(sec)}
              className="flex-1 py-1.5 rounded-md border border-black/[0.06] dark:border-white/[0.06] text-xs font-light text-neutral-400 hover:text-foreground hover:border-foreground/20 transition-all"
            >
              {sec >= 60 ? `${sec / 60}分` : `${sec}秒`}
            </button>
          ))}
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {workout.exercises.map((we) => (
          <ExerciseCard
            key={we.weId}
            exercise={we}
            isExpanded={expandedExercise === we.weId}
            onToggle={() =>
              setExpandedExercise(
                expandedExercise === we.weId ? null : we.weId
              )
            }
            onLogSet={handleLogSet}
            onRemoveSet={handleRemoveSet}
            onAddSet={handleAddSet}
            onRemoveExercise={handleRemoveExercise}
          />
        ))}
      </div>

      {/* Add exercise button */}
      <button
        onClick={() => {
          setShowAddExercise(true);
          setSearchQuery("");
          setSelectedCategory(undefined);
        }}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-black/10 dark:border-white/10 rounded-lg text-sm font-light text-neutral-400 hover:text-foreground hover:border-foreground/20 transition-all"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} />
        新增動作
      </button>

      {/* Discard button */}
      <button
        onClick={() => setShowDiscardConfirm(true)}
        className="w-full py-2 text-xs text-neutral-300 dark:text-neutral-700 hover:text-destructive transition-colors"
      >
        取消訓練
      </button>

      {/* Add exercise dialog */}
      <Dialog
        open={showAddExercise}
        onOpenChange={setShowAddExercise}
      >
        <DialogHeader>
          <DialogTitle>新增動作</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋動作..."
              className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent pl-9 pr-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {!searchQuery && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedCategory(undefined)}
                className={`px-2.5 py-1 rounded-full text-xs font-light transition-all ${
                  !selectedCategory
                    ? "bg-primary text-white"
                    : "bg-neutral-100 dark:bg-neutral-900 text-neutral-500 hover:text-foreground"
                }`}
              >
                全部
              </button>
              {EXERCISE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-light transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-white"
                      : "bg-neutral-100 dark:bg-neutral-900 text-neutral-500 hover:text-foreground"
                  }`}
                >
                  {EXERCISE_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-0 max-h-60 overflow-y-auto">
            {exerciseList && exerciseList.length > 0 ? (
              exerciseList.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAddExercise(ex.id)}
                  className="w-full flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-light">{ex.name}</span>
                    {ex.category && (
                      <span className="ml-2 text-[10px] text-neutral-400">
                        {EXERCISE_CATEGORY_LABELS[ex.category] ?? ex.category}
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm font-light text-neutral-400 text-center py-4">
                {searchQuery ? "找不到相符的動作" : "沒有動作"}
              </p>
            )}
          </div>
        </div>
      </Dialog>

      {/* Finish confirm */}
      <Dialog
        open={showFinishConfirm}
        onOpenChange={setShowFinishConfirm}
      >
        <DialogHeader>
          <DialogTitle>完成訓練？</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-neutral-500">
            訓練時間：{formatDuration(timerStore.elapsedSeconds)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFinishConfirm(false)}
              className="flex-1 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm font-light"
            >
              繼續訓練
            </button>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
            >
              {saving ? "儲存中..." : "完成"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Discard confirm */}
      <Dialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
      >
        <DialogHeader>
          <DialogTitle>取消訓練？</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-neutral-500">
            所有記錄將被刪除，此操作無法復原。
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDiscardConfirm(false)}
              className="flex-1 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm font-light"
            >
              返回
            </button>
            <button
              onClick={handleDiscard}
              className="flex-1 py-2 rounded-lg bg-destructive text-white text-sm font-medium"
            >
              取消訓練
            </button>
          </div>
        </div>
      </Dialog>

      {/* Save as template */}
      <Dialog
        open={showSaveTemplate}
        onOpenChange={setShowSaveTemplate}
      >
        <DialogHeader>
          <DialogTitle>儲存為模板</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-light text-neutral-500">
              模板名稱
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="例：推日、腿日"
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleSaveAsTemplate}
            disabled={!templateName.trim()}
            className="w-full py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
          >
            儲存
          </button>
        </div>
      </Dialog>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
}

// Exercise card component
function ExerciseCard({
  exercise,
  isExpanded,
  onToggle,
  onLogSet,
  onRemoveSet,
  onAddSet,
  onRemoveExercise,
}: {
  exercise: {
    weId: string;
    exerciseId: string;
    exerciseName: string;
    exerciseCategory: string | null;
    sets: Array<{
      id: string;
      setNumber: number;
      weightKg: string | null;
      reps: number | null;
      isWarmup: boolean;
      isDropset: boolean;
      isPersonalRecord: boolean;
      completedAt: string | Date | null;
    }>;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onLogSet: (
    weId: string,
    setNumber: number,
    weightKg: number | undefined,
    reps: number | undefined
  ) => void;
  onRemoveSet: (setId: string) => void;
  onAddSet: (weId: string, nextSetNumber: number) => void;
  onRemoveExercise: (weId: string) => void;
}) {
  // Previous performance hints
  const { data: prevHistory } = trpc.workout.getExerciseHistory.useQuery(
    { exerciseId: exercise.exerciseId, limit: 1 },
    { enabled: true }
  );

  const lastPerformance = prevHistory?.[0];

  return (
    <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
      {/* Exercise header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">
            {exercise.exerciseName}
          </span>
          {exercise.exerciseCategory && (
            <span className="text-[10px] text-neutral-400">
              {EXERCISE_CATEGORY_LABELS[exercise.exerciseCategory] ??
                exercise.exerciseCategory}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            {exercise.sets.filter((s) => s.completedAt).length}/
            {exercise.sets.length} 組
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          ) : (
            <ChevronDown
              className="h-4 w-4 text-neutral-400"
              strokeWidth={1.5}
            />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Previous performance hint */}
          {lastPerformance && lastPerformance.sets.length > 0 && (
            <div className="text-[10px] text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded px-2 py-1">
              上次：
              {lastPerformance.sets
                .filter((s) => !s.isWarmup)
                .map(
                  (s) =>
                    `${s.weightKg ? Number(s.weightKg) : 0}kg×${s.reps ?? 0}`
                )
                .join("、")}
            </div>
          )}

          {/* Column headers */}
          <div className="grid grid-cols-[40px_1fr_1fr_32px_32px] gap-1 text-[10px] text-neutral-400 px-1">
            <span>組</span>
            <span>重量 (kg)</span>
            <span>次數</span>
            <span />
            <span />
          </div>

          {/* Sets */}
          {exercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              weId={exercise.weId}
              onLogSet={onLogSet}
              onRemoveSet={onRemoveSet}
            />
          ))}

          {/* Add set */}
          <button
            onClick={() =>
              onAddSet(
                exercise.weId,
                (exercise.sets[exercise.sets.length - 1]?.setNumber ?? 0) + 1
              )
            }
            className="w-full py-1.5 text-xs text-neutral-400 hover:text-foreground transition-colors"
          >
            + 新增一組
          </button>

          {/* Remove exercise */}
          <button
            onClick={() => onRemoveExercise(exercise.weId)}
            className="w-full py-1 text-[10px] text-neutral-300 dark:text-neutral-700 hover:text-destructive transition-colors"
          >
            移除此動作
          </button>
        </div>
      )}
    </div>
  );
}

// Set row component
function SetRow({
  set,
  weId,
  onLogSet,
  onRemoveSet,
}: {
  set: {
    id: string;
    setNumber: number;
    weightKg: string | null;
    reps: number | null;
    isWarmup: boolean;
    isDropset: boolean;
    isPersonalRecord: boolean;
    completedAt: string | Date | null;
  };
  weId: string;
  onLogSet: (
    weId: string,
    setNumber: number,
    weightKg: number | undefined,
    reps: number | undefined
  ) => void;
  onRemoveSet: (setId: string) => void;
}) {
  const [weight, setWeight] = useState(
    set.weightKg ? String(Number(set.weightKg)) : ""
  );
  const [reps, setReps] = useState(set.reps ? String(set.reps) : "");

  // Sync from props when data changes
  useEffect(() => {
    setWeight(set.weightKg ? String(Number(set.weightKg)) : "");
    setReps(set.reps ? String(set.reps) : "");
  }, [set.weightKg, set.reps]);

  const handleComplete = () => {
    onLogSet(
      weId,
      set.setNumber,
      weight ? Number(weight) : undefined,
      reps ? Number(reps) : undefined
    );
  };

  const isCompleted = !!set.completedAt;

  return (
    <div
      className={`grid grid-cols-[40px_1fr_1fr_32px_32px] gap-1 items-center ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      <span
        className={`text-xs font-light text-center ${
          set.isWarmup
            ? "text-amber-500"
            : set.isPersonalRecord
              ? "text-primary font-medium"
              : "text-neutral-400"
        }`}
      >
        {set.isWarmup ? "W" : set.setNumber}
      </span>
      <input
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="-"
        className="w-full rounded border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-2 py-1.5 text-sm font-light text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <input
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        placeholder="-"
        className="w-full rounded border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-2 py-1.5 text-sm font-light text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        onClick={handleComplete}
        className={`flex items-center justify-center h-7 w-7 rounded transition-all ${
          isCompleted
            ? "bg-primary/20 text-primary"
            : "border border-black/[0.06] dark:border-white/[0.06] text-neutral-300 hover:text-primary hover:border-primary/30"
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <button
        onClick={() => onRemoveSet(set.id)}
        className="flex items-center justify-center h-7 w-7 text-neutral-200 dark:text-neutral-800 hover:text-destructive transition-colors"
      >
        <Trash2 className="h-3 w-3" strokeWidth={1.5} />
      </button>
    </div>
  );
}
