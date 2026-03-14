/**
 * Shared posture timer logic — pure calculations, no platform dependencies.
 * Used by both web and mobile to compute timer state & reminder decisions.
 */

export const MS_PER_MINUTE = 60 * 1000;

export interface PostureSession {
  startedAt: Date | string;
  maxMinutes: number;
}

export interface PostureConfig {
  reminderEnabled?: boolean;
  snoozeMinutes?: number;
}

export interface TimerState {
  /** Milliseconds elapsed since session started */
  elapsedMs: number;
  /** Maximum allowed milliseconds */
  maxMs: number;
  /** Whether the session has exceeded its time limit */
  isOvertime: boolean;
  /** Progress percentage (0–100, capped at 100) */
  progressPercent: number;
  /** Whether the user is currently in a snooze period */
  isSnoozed: boolean;
  /** Whether an alarm should be triggered right now */
  shouldAlarm: boolean;
}

/**
 * Compute the current timer state from session data, config, and snooze state.
 *
 * @param session - Active posture session (startedAt + maxMinutes)
 * @param config - User's reminder config
 * @param snoozedUntil - Timestamp (ms) until which alarm is snoozed, or null
 * @param now - Current timestamp in ms (defaults to Date.now())
 */
export function getTimerState(
  session: PostureSession,
  config: PostureConfig | undefined | null,
  snoozedUntil: number | null,
  now: number = Date.now(),
): TimerState {
  const startTime =
    typeof session.startedAt === "string"
      ? new Date(session.startedAt).getTime()
      : session.startedAt.getTime();

  const elapsedMs = now - startTime;
  const maxMs = session.maxMinutes * MS_PER_MINUTE;
  const isOvertime = elapsedMs > maxMs && maxMs > 0;
  const progressPercent = maxMs > 0 ? Math.min((elapsedMs / maxMs) * 100, 100) : 0;
  const isSnoozed = snoozedUntil !== null && now < snoozedUntil;
  const shouldAlarm = isOvertime && config?.reminderEnabled !== false && !isSnoozed;

  return { elapsedMs, maxMs, isOvertime, progressPercent, isSnoozed, shouldAlarm };
}

/**
 * Compute the snooze-until timestamp from current time and config.
 */
export function computeSnoozeUntil(
  config: PostureConfig | undefined | null,
  now: number = Date.now(),
): number {
  const snoozeMinutes = config?.snoozeMinutes ?? 10;
  return now + snoozeMinutes * MS_PER_MINUTE;
}

/**
 * Format milliseconds into zero-padded MM:SS strings.
 */
export function formatDuration(ms: number): { minutes: string; seconds: string } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}
