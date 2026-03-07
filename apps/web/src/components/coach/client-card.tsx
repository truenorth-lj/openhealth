"use client";

import Link from "next/link";
import { User, ChevronRight } from "lucide-react";

interface ClientCardProps {
  clientId: string;
  name: string;
  email: string;
  image: string | null;
  startDate: string;
  latestWeight: { weightKg: string; date: string } | null;
}

export function ClientCard({
  clientId,
  name,
  email,
  startDate,
  latestWeight,
}: ClientCardProps) {
  return (
    <Link
      href={`/coach/client/${clientId}`}
      className="group flex items-center justify-between rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 transition-all duration-300 hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.06]">
          <User className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-light">{name}</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            {email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          {latestWeight && (
            <p className="text-sm font-light">
              {Number(latestWeight.weightKg).toFixed(1)} kg
            </p>
          )}
          <p className="text-[10px] text-neutral-400 dark:text-neutral-600">
            {startDate} 起
          </p>
        </div>
        <ChevronRight
          className="h-4 w-4 text-neutral-300 dark:text-neutral-700 transition-all group-hover:translate-x-0.5"
          strokeWidth={1.5}
        />
      </div>
    </Link>
  );
}
