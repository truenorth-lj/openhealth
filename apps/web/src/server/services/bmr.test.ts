import { describe, it, expect } from "vitest";
import { calculateBMR, calculateTDEE, getAge } from "./bmr";

describe("calculateBMR", () => {
  it("calculates BMR for male", () => {
    // Mifflin-St Jeor: 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1649
    expect(calculateBMR({ sex: "male", weightKg: 70, heightCm: 175, age: 30 })).toBe(1649);
  });

  it("calculates BMR for female", () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345
    expect(calculateBMR({ sex: "female", weightKg: 60, heightCm: 165, age: 25 })).toBe(1345);
  });

  it("uses average for sex=other", () => {
    const male = calculateBMR({ sex: "male", weightKg: 70, heightCm: 175, age: 30 });
    const female = calculateBMR({ sex: "female", weightKg: 70, heightCm: 175, age: 30 });
    const other = calculateBMR({ sex: "other", weightKg: 70, heightCm: 175, age: 30 });
    // "other" = base - 78, which is the average of (base+5) and (base-161)
    expect(other).toBe(Math.round((male + female) / 2));
  });

  it("uses average for sex=null", () => {
    const other = calculateBMR({ sex: "other", weightKg: 70, heightCm: 175, age: 30 });
    const nullSex = calculateBMR({ sex: null, weightKg: 70, heightCm: 175, age: 30 });
    expect(nullSex).toBe(other);
  });
});

describe("calculateTDEE", () => {
  const bmr = 1648;

  it("applies sedentary multiplier", () => {
    expect(calculateTDEE(bmr, "sedentary")).toBe(Math.round(bmr * 1.2));
  });

  it("applies lightly_active multiplier", () => {
    expect(calculateTDEE(bmr, "lightly_active")).toBe(Math.round(bmr * 1.375));
  });

  it("applies moderately_active multiplier", () => {
    expect(calculateTDEE(bmr, "moderately_active")).toBe(Math.round(bmr * 1.55));
  });

  it("applies very_active multiplier", () => {
    expect(calculateTDEE(bmr, "very_active")).toBe(Math.round(bmr * 1.725));
  });

  it("applies extremely_active multiplier", () => {
    expect(calculateTDEE(bmr, "extremely_active")).toBe(Math.round(bmr * 1.9));
  });

  it("defaults to moderately_active for null", () => {
    expect(calculateTDEE(bmr, null)).toBe(Math.round(bmr * 1.55));
  });

  it("defaults to moderately_active for unknown level", () => {
    expect(calculateTDEE(bmr, "unknown_level")).toBe(Math.round(bmr * 1.55));
  });
});

describe("getAge", () => {
  it("calculates age from date of birth", () => {
    const today = new Date();
    const thirtyYearsAgo = new Date(today.getFullYear() - 30, 0, 1);
    const dob = thirtyYearsAgo.toISOString().split("T")[0];
    expect(getAge(dob)).toBe(30);
  });

  it("subtracts 1 if birthday has not yet occurred this year", () => {
    const today = new Date();
    // Set birthday to next month
    const nextMonth = (today.getMonth() + 2) % 12; // 0-indexed, +2 to ensure future
    const yearOffset = nextMonth <= today.getMonth() ? 1 : 0;
    const dob = `${today.getFullYear() - 25 + yearOffset}-${String(nextMonth + 1).padStart(2, "0")}-15`;
    expect(getAge(dob)).toBe(24);
  });
});
