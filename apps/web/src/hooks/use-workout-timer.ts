"use client";

import { create } from "zustand";
import { useEffect, useRef } from "react";

interface WorkoutTimerState {
  // Elapsed timer
  elapsedSeconds: number;
  isRunning: boolean;
  workoutId: string | null;

  // Rest timer
  restTimer: { remaining: number; total: number } | null;

  // Actions
  startWorkout: (workoutId: string, startedAt: Date) => void;
  stopWorkout: () => void;
  tick: () => void;
  startRestTimer: (seconds: number) => void;
  cancelRestTimer: () => void;
  tickRest: () => void;
}

export const useWorkoutTimerStore = create<WorkoutTimerState>((set) => ({
  elapsedSeconds: 0,
  isRunning: false,
  workoutId: null,
  restTimer: null,

  startWorkout: (workoutId, startedAt) =>
    set({
      workoutId,
      isRunning: true,
      elapsedSeconds: Math.floor(
        (Date.now() - startedAt.getTime()) / 1000
      ),
    }),

  stopWorkout: () =>
    set({
      workoutId: null,
      isRunning: false,
      elapsedSeconds: 0,
      restTimer: null,
    }),

  tick: () =>
    set((state) => ({
      elapsedSeconds: state.isRunning
        ? state.elapsedSeconds + 1
        : state.elapsedSeconds,
    })),

  startRestTimer: (seconds) =>
    set({ restTimer: { remaining: seconds, total: seconds } }),

  cancelRestTimer: () => set({ restTimer: null }),

  tickRest: () =>
    set((state) => {
      if (!state.restTimer) return state;
      const remaining = state.restTimer.remaining - 1;
      if (remaining <= 0) {
        return { restTimer: null };
      }
      return {
        restTimer: { ...state.restTimer, remaining },
      };
    }),
}));

/** Hook that runs the timer intervals */
export function useWorkoutTimerTick() {
  const isRunning = useWorkoutTimerStore((s) => s.isRunning);
  const restTimer = useWorkoutTimerStore((s) => s.restTimer);
  const tick = useWorkoutTimerStore((s) => s.tick);
  const tickRest = useWorkoutTimerStore((s) => s.tickRest);

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (isRunning || restTimer) {
      intervalRef.current = setInterval(() => {
        if (isRunning) tick();
        if (restTimer) tickRest();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, restTimer, tick, tickRest]);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
