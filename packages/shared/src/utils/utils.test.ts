import { describe, it, expect } from "vitest";
import { formatCalories, formatMacro, formatDate, todayString } from "./index";

describe("formatCalories", () => {
  it("rounds to integer", () => {
    expect(formatCalories(123.7)).toBe("124");
    expect(formatCalories(123.2)).toBe("123");
  });

  it("handles zero", () => {
    expect(formatCalories(0)).toBe("0");
  });

  it("handles large numbers with locale formatting", () => {
    const result = formatCalories(1234);
    // locale-aware: could be "1,234" or "1234" depending on env
    expect(parseInt(result.replace(/,/g, ""), 10)).toBe(1234);
  });

  it("handles negative values", () => {
    // Math.round(-5.5) === -5 in JS (rounds toward +Infinity)
    expect(formatCalories(-5.5)).toBe("-5");
  });
});

describe("formatMacro", () => {
  it("formats to 1 decimal place", () => {
    expect(formatMacro(12.34)).toBe("12.3");
    expect(formatMacro(12.05)).toBe("12.1");
  });

  it("adds trailing zero", () => {
    expect(formatMacro(5)).toBe("5.0");
  });

  it("handles zero", () => {
    expect(formatMacro(0)).toBe("0.0");
  });
});

describe("formatDate", () => {
  it("formats as YYYY-MM-DD", () => {
    const d = new Date("2024-03-15T10:30:00Z");
    expect(formatDate(d)).toBe("2024-03-15");
  });

  it("pads single-digit month and day", () => {
    const d = new Date("2024-01-05T00:00:00Z");
    expect(formatDate(d)).toBe("2024-01-05");
  });
});

describe("todayString", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = todayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches formatDate(new Date())", () => {
    expect(todayString()).toBe(formatDate(new Date()));
  });
});
