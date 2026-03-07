"use client";

import { useWaterReminder } from "@/hooks/use-water-reminder";

export function WaterReminderProvider() {
  useWaterReminder();
  return null;
}
