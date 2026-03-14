/**
 * Shared water milestone logic — pure calculations, no platform dependencies.
 * Used by both web and mobile to evaluate milestone checkpoints & generate reminder messages.
 */

export interface MilestoneCheckpoint {
  time: string; // "HH:mm"
  targetMl: number; // cumulative target by that time
}

export interface MilestoneEvaluation {
  shouldRemind: boolean;
  checkpoint: MilestoneCheckpoint | null;
  currentIntakeMl: number;
  deficitMl: number;
}

/**
 * Convert "HH:mm" to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Evaluate milestone checkpoints against current water intake.
 *
 * Finds the most recent checkpoint whose time has passed and checks
 * if the user's intake is below its target.
 */
export function evaluateMilestones(
  checkpoints: MilestoneCheckpoint[],
  currentTimeMins: number,
  currentIntakeMl: number,
  stopWhenGoalReached: boolean,
  dailyGoalMl: number,
): MilestoneEvaluation {
  const noReminder: MilestoneEvaluation = {
    shouldRemind: false,
    checkpoint: null,
    currentIntakeMl,
    deficitMl: 0,
  };

  if (checkpoints.length === 0) return noReminder;

  if (stopWhenGoalReached && currentIntakeMl >= dailyGoalMl) return noReminder;

  // Find the most recent checkpoint that has passed
  const sorted = [...checkpoints].sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
  );

  let activeCheckpoint: MilestoneCheckpoint | null = null;
  for (const cp of sorted) {
    if (timeToMinutes(cp.time) <= currentTimeMins) {
      activeCheckpoint = cp;
    } else {
      break;
    }
  }

  if (!activeCheckpoint) return noReminder;

  const deficit = activeCheckpoint.targetMl - currentIntakeMl;
  if (deficit <= 0) return noReminder;

  return {
    shouldRemind: true,
    checkpoint: activeCheckpoint,
    currentIntakeMl,
    deficitMl: deficit,
  };
}

/**
 * Get the next upcoming checkpoint (for scheduling or display).
 */
export function getNextCheckpoint(
  checkpoints: MilestoneCheckpoint[],
  currentTimeMins: number,
): MilestoneCheckpoint | null {
  const sorted = [...checkpoints].sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
  );

  for (const cp of sorted) {
    if (timeToMinutes(cp.time) > currentTimeMins) {
      return cp;
    }
  }

  return null;
}

/**
 * Validate checkpoints: times must be chronological, targets must be increasing.
 * Returns an array of error keys (empty = valid).
 */
export function validateCheckpoints(
  checkpoints: MilestoneCheckpoint[],
): string[] {
  const errors: string[] = [];
  if (checkpoints.length === 0) return errors;

  for (let i = 1; i < checkpoints.length; i++) {
    if (timeToMinutes(checkpoints[i].time) <= timeToMinutes(checkpoints[i - 1].time)) {
      errors.push("validationTimeOrder");
      break;
    }
  }

  for (let i = 1; i < checkpoints.length; i++) {
    if (checkpoints[i].targetMl <= checkpoints[i - 1].targetMl) {
      errors.push("validationTargetOrder");
      break;
    }
  }

  return errors;
}

/**
 * Generate suggested checkpoints based on daily goal and active hours.
 */
export function generateSuggestedCheckpoints(
  dailyGoalMl: number,
  startTime: string,
  endTime: string,
  count: number = 4,
): MilestoneCheckpoint[] {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const totalMinutes = endMins - startMins;

  if (totalMinutes <= 0 || count <= 0) return [];

  const checkpoints: MilestoneCheckpoint[] = [];
  for (let i = 1; i <= count; i++) {
    const mins = startMins + Math.round((totalMinutes * i) / (count + 1));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const targetMl = Math.round((dailyGoalMl * i) / (count + 1));
    checkpoints.push({ time, targetMl });
  }

  return checkpoints;
}
