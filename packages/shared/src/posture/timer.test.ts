import { describe, it, expect } from "vitest";
import {
  getTimerState,
  computeSnoozeUntil,
  formatDuration,
  MS_PER_MINUTE,
} from "./timer";

describe("getTimerState", () => {
  const baseSession = { startedAt: new Date("2024-01-01T00:00:00Z"), maxMinutes: 45 };
  const baseConfig = { reminderEnabled: true, snoozeMinutes: 10 };

  it("returns correct state when not overtime", () => {
    const now = new Date("2024-01-01T00:20:00Z").getTime(); // 20 min in
    const state = getTimerState(baseSession, baseConfig, null, now);

    expect(state.elapsedMs).toBe(20 * MS_PER_MINUTE);
    expect(state.maxMs).toBe(45 * MS_PER_MINUTE);
    expect(state.isOvertime).toBe(false);
    expect(state.shouldAlarm).toBe(false);
    expect(state.progressPercent).toBeCloseTo((20 / 45) * 100, 1);
  });

  it("returns overtime + shouldAlarm when past limit", () => {
    const now = new Date("2024-01-01T00:50:00Z").getTime(); // 50 min in
    const state = getTimerState(baseSession, baseConfig, null, now);

    expect(state.isOvertime).toBe(true);
    expect(state.shouldAlarm).toBe(true);
    expect(state.progressPercent).toBe(100);
  });

  it("suppresses alarm when snoozed", () => {
    const now = new Date("2024-01-01T00:50:00Z").getTime();
    const snoozedUntil = now + 10 * MS_PER_MINUTE;
    const state = getTimerState(baseSession, baseConfig, snoozedUntil, now);

    expect(state.isOvertime).toBe(true);
    expect(state.isSnoozed).toBe(true);
    expect(state.shouldAlarm).toBe(false);
  });

  it("alarms after snooze expires", () => {
    const now = new Date("2024-01-01T01:05:00Z").getTime();
    const snoozedUntil = new Date("2024-01-01T01:00:00Z").getTime(); // expired
    const state = getTimerState(baseSession, baseConfig, snoozedUntil, now);

    expect(state.isSnoozed).toBe(false);
    expect(state.shouldAlarm).toBe(true);
  });

  it("suppresses alarm when reminderEnabled is false", () => {
    const now = new Date("2024-01-01T00:50:00Z").getTime();
    const state = getTimerState(baseSession, { reminderEnabled: false }, null, now);

    expect(state.isOvertime).toBe(true);
    expect(state.shouldAlarm).toBe(false);
  });

  it("handles string startedAt", () => {
    const session = { startedAt: "2024-01-01T00:00:00Z", maxMinutes: 45 };
    const now = new Date("2024-01-01T00:20:00Z").getTime();
    const state = getTimerState(session, baseConfig, null, now);

    expect(state.elapsedMs).toBe(20 * MS_PER_MINUTE);
  });

  it("handles null/undefined config as reminder enabled", () => {
    const now = new Date("2024-01-01T00:50:00Z").getTime();
    const state = getTimerState(baseSession, null, null, now);

    expect(state.shouldAlarm).toBe(true);
  });
});

describe("computeSnoozeUntil", () => {
  it("uses config snoozeMinutes", () => {
    const now = 1000000;
    const result = computeSnoozeUntil({ snoozeMinutes: 15 }, now);
    expect(result).toBe(now + 15 * MS_PER_MINUTE);
  });

  it("defaults to 10 minutes", () => {
    const now = 1000000;
    const result = computeSnoozeUntil(null, now);
    expect(result).toBe(now + 10 * MS_PER_MINUTE);
  });
});

describe("formatDuration", () => {
  it("formats zero", () => {
    expect(formatDuration(0)).toEqual({ minutes: "00", seconds: "00" });
  });

  it("formats 90 seconds", () => {
    expect(formatDuration(90_000)).toEqual({ minutes: "01", seconds: "30" });
  });

  it("handles negative values", () => {
    expect(formatDuration(-5000)).toEqual({ minutes: "00", seconds: "00" });
  });

  it("pads single digits", () => {
    expect(formatDuration(5_000)).toEqual({ minutes: "00", seconds: "05" });
  });
});
