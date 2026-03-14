import { describe, it, expect } from "vitest";
import {
  evaluateMilestones,
  getNextCheckpoint,
  validateCheckpoints,
  generateSuggestedCheckpoints,
  timeToMinutes,
} from "./milestone";

describe("timeToMinutes", () => {
  it("converts HH:mm to minutes", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("08:00")).toBe(480);
    expect(timeToMinutes("12:30")).toBe(750);
    expect(timeToMinutes("23:59")).toBe(1439);
  });
});

describe("evaluateMilestones", () => {
  const checkpoints = [
    { time: "10:00", targetMl: 500 },
    { time: "14:00", targetMl: 1200 },
    { time: "18:00", targetMl: 2000 },
  ];

  it("returns no reminder before first checkpoint", () => {
    const result = evaluateMilestones(checkpoints, 540, 0, true, 2500); // 9:00
    expect(result.shouldRemind).toBe(false);
  });

  it("reminds when behind at checkpoint time", () => {
    const result = evaluateMilestones(checkpoints, 600, 200, true, 2500); // 10:00, only 200ml
    expect(result.shouldRemind).toBe(true);
    expect(result.checkpoint?.time).toBe("10:00");
    expect(result.deficitMl).toBe(300);
  });

  it("does not remind when on track", () => {
    const result = evaluateMilestones(checkpoints, 600, 600, true, 2500); // 10:00, 600ml >= 500ml
    expect(result.shouldRemind).toBe(false);
  });

  it("checks the most recent checkpoint", () => {
    const result = evaluateMilestones(checkpoints, 900, 800, true, 2500); // 15:00, 800ml < 1200ml
    expect(result.shouldRemind).toBe(true);
    expect(result.checkpoint?.time).toBe("14:00");
    expect(result.deficitMl).toBe(400);
  });

  it("stops when goal reached if enabled", () => {
    const result = evaluateMilestones(checkpoints, 900, 2500, true, 2500);
    expect(result.shouldRemind).toBe(false);
  });

  it("still checks when goal reached if stopWhenGoalReached is false", () => {
    // When intake >= checkpoint target, no deficit → no remind anyway
    const result = evaluateMilestones(checkpoints, 600, 2500, false, 2500);
    expect(result.shouldRemind).toBe(false);
  });

  it("handles empty checkpoints", () => {
    const result = evaluateMilestones([], 600, 0, true, 2500);
    expect(result.shouldRemind).toBe(false);
  });
});

describe("getNextCheckpoint", () => {
  const checkpoints = [
    { time: "10:00", targetMl: 500 },
    { time: "14:00", targetMl: 1200 },
    { time: "18:00", targetMl: 2000 },
  ];

  it("returns next upcoming checkpoint", () => {
    const result = getNextCheckpoint(checkpoints, 540); // 9:00
    expect(result?.time).toBe("10:00");
  });

  it("skips past checkpoints", () => {
    const result = getNextCheckpoint(checkpoints, 720); // 12:00
    expect(result?.time).toBe("14:00");
  });

  it("returns null after all checkpoints", () => {
    const result = getNextCheckpoint(checkpoints, 1100); // 18:20
    expect(result).toBeNull();
  });
});

describe("validateCheckpoints", () => {
  it("returns no errors for valid checkpoints", () => {
    const errors = validateCheckpoints([
      { time: "10:00", targetMl: 500 },
      { time: "14:00", targetMl: 1200 },
    ]);
    expect(errors).toEqual([]);
  });

  it("detects non-chronological times", () => {
    const errors = validateCheckpoints([
      { time: "14:00", targetMl: 500 },
      { time: "10:00", targetMl: 1200 },
    ]);
    expect(errors).toContain("validationTimeOrder");
  });

  it("detects non-increasing targets", () => {
    const errors = validateCheckpoints([
      { time: "10:00", targetMl: 1200 },
      { time: "14:00", targetMl: 500 },
    ]);
    expect(errors).toContain("validationTargetOrder");
  });
});

describe("generateSuggestedCheckpoints", () => {
  it("generates evenly spaced checkpoints", () => {
    const result = generateSuggestedCheckpoints(2500, "08:00", "22:00", 4);
    expect(result).toHaveLength(4);
    // Targets should be increasing
    for (let i = 1; i < result.length; i++) {
      expect(timeToMinutes(result[i].time)).toBeGreaterThan(
        timeToMinutes(result[i - 1].time),
      );
      expect(result[i].targetMl).toBeGreaterThan(result[i - 1].targetMl);
    }
    // Last checkpoint target should be less than daily goal
    expect(result[result.length - 1].targetMl).toBeLessThan(2500);
  });

  it("returns empty for invalid range", () => {
    expect(generateSuggestedCheckpoints(2500, "22:00", "08:00", 4)).toEqual([]);
  });
});
