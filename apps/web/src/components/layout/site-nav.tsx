"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "react-i18next";

const navLinks = [
  { href: "/", labelKey: "nav.home" as const },
  { href: "/blog", labelKey: "nav.blog" as const },
  { href: "/docs", labelKey: "nav.docs" as const },
];

export function SiteNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/60 dark:bg-black/60 border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-light tracking-[0.3em] text-black dark:text-white"
        >
          OH
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map(({ href, labelKey }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`relative py-5 transition-colors duration-300 ${
                  isActive
                    ? "text-black dark:text-white"
                    : "text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white"
                }`}
              >
                {t(labelKey)}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black dark:bg-white" />
                )}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/hub"
            className="text-sm text-black dark:text-white hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-300"
          >
            {t("nav.getStarted")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
