/**
 * Mifflin-St Jeor BMR + TDEE calculation.
 */

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

export function calculateBMR(params: {
  sex: "male" | "female" | "other" | null;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = params;
  // Mifflin-St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return Math.round(base + 5);
  if (sex === "female") return Math.round(base - 161);
  // "other" or null — average of male/female
  return Math.round(base - 78);
}

export function calculateTDEE(
  bmr: number,
  activityLevel: string | null
): number {
  const multiplier =
    ACTIVITY_MULTIPLIERS[activityLevel ?? "moderately_active"] ?? 1.55;
  return Math.round(bmr * multiplier);
}

export function getAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}
