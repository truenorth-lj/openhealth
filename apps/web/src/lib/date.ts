export function getTaiwanDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

export function getTaipeiTodayStart(): Date {
  const taipeiStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Taipei",
  });
  return new Date(`${taipeiStr}T00:00:00+08:00`);
}
