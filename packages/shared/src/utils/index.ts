export function formatCalories(calories: number): string {
  return Math.round(calories).toLocaleString();
}

export function formatMacro(grams: number): string {
  return grams.toFixed(1);
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function todayString(): string {
  return formatDate(new Date());
}
