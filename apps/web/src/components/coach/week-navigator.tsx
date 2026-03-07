"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavigatorProps {
  weekStart: string;
  onWeekChange: (newWeekStart: string) => void;
}

export function WeekNavigator({ weekStart, onWeekChange }: WeekNavigatorProps) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const formatDate = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`;

  const navigate = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    onWeekChange(d.toISOString().slice(0, 10));
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate(-1)}
        className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-2 transition-all hover:border-foreground/20"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <span className="text-sm font-light min-w-[120px] text-center">
        {formatDate(start)} - {formatDate(end)}
      </span>
      <button
        onClick={() => navigate(1)}
        className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-2 transition-all hover:border-foreground/20"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
