"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isToday, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const goBack = () => onDateChange(subDays(date, 1));
  const goForward = () => onDateChange(addDays(date, 1));
  const goToday = () => onDateChange(new Date());

  const label = isToday(date)
    ? "今天"
    : format(date, "M月d日 EEEE", { locale: zhTW });

  const today = isToday(date);

  const handleDateLabelClick = () => {
    if (inputRef.current?.showPicker) {
      inputRef.current.showPicker();
    } else {
      inputRef.current?.click();
    }
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onDateChange(parseISO(e.target.value));
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <button
        onClick={goBack}
        className="p-2 text-neutral-400 transition-all duration-300 hover:text-foreground"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <div className="flex flex-col items-center relative">
        <button
          onClick={handleDateLabelClick}
          className="text-base font-light tracking-wide transition-all duration-300 hover:opacity-60"
        >
          {label}
        </button>
        <input
          ref={inputRef}
          type="date"
          value={format(date, "yyyy-MM-dd")}
          onChange={handleNativeDateChange}
          className="absolute inset-0 opacity-0 pointer-events-none"
          tabIndex={-1}
        />
        {!today && (
          <button
            onClick={goToday}
            className="text-xs font-light text-neutral-400 transition-all duration-300 hover:text-foreground mt-0.5"
          >
            回到今天
          </button>
        )}
      </div>

      <button
        onClick={goForward}
        className="p-2 text-neutral-400 transition-all duration-300 hover:text-foreground"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
