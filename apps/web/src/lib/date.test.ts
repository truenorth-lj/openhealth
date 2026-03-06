import { describe, it, expect } from "vitest";
import { getTaiwanDate, getTaipeiTodayStart } from "./date";

describe("getTaiwanDate", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = getTaiwanDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns a valid date string", () => {
    const result = getTaiwanDate();
    const parsed = new Date(result);
    expect(parsed.toString()).not.toBe("Invalid Date");
  });
});

describe("getTaipeiTodayStart", () => {
  it("returns a Date object", () => {
    const result = getTaipeiTodayStart();
    expect(result).toBeInstanceOf(Date);
  });

  it("returns midnight (00:00:00) in UTC+8", () => {
    const result = getTaipeiTodayStart();
    // UTC+8 midnight = previous day 16:00 UTC
    const hours = result.getUTCHours();
    expect(hours).toBe(16);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
  });
});
