"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutGrid, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const navItems = [
  { href: "/today", labelKey: "nav.today" as const, icon: CalendarDays },
  { href: "/hub", labelKey: "nav.hub" as const, icon: LayoutGrid },
  { href: "/settings", labelKey: "nav.settings" as const, icon: Settings2 },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav data-testid="bottom-nav" className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.06] dark:border-white/[0.06] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-lg lg:max-w-3xl items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs font-light transition-all duration-300",
                isActive
                  ? "text-primary"
                  : "text-neutral-400 dark:text-neutral-600 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={1.5} />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
