"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, subDays, isToday } from "date-fns";
import { zhTW } from "date-fns/locale";

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const goBack = () => onDateChange(subDays(date, 1));
  const goForward = () => onDateChange(addDays(date, 1));
  const goToday = () => onDateChange(new Date());

  const label = isToday(date)
    ? "今天"
    : format(date, "M月d日 EEEE", { locale: zhTW });

  const today = isToday(date);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <Button variant="ghost" size="icon" onClick={goBack}>
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex flex-col items-center">
        <button
          onClick={goToday}
          className="text-base font-semibold hover:text-primary transition-colors"
        >
          {label}
        </button>
        {!today && (
          <button
            onClick={goToday}
            className="text-xs text-primary hover:underline mt-0.5"
          >
            回到今天
          </button>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={goForward}>
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
