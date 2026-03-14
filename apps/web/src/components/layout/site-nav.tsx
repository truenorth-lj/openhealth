"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "react-i18next";
import { defaultLocale, locales, type Locale } from "@/lib/i18n-config";
import { useLocalePath } from "@/hooks/use-locale-path";

const navLinks = [
  { path: "/", labelKey: "nav.home" as const },
  { path: "/pricing", labelKey: "nav.pricing" as const },
  { path: "/blog", labelKey: "nav.blog" as const },
  { path: "/docs", labelKey: "nav.docs" as const },
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const lp = useLocalePath();

  const currentLocale = (params?.locale as string) || defaultLocale;

  // Strip locale prefix from pathname for active detection
  const pathnameWithoutLocale = (() => {
    for (const locale of locales) {
      if (pathname.startsWith(`/${locale}/`)) {
        return pathname.slice(`/${locale}`.length);
      }
      if (pathname === `/${locale}`) {
        return "/";
      }
    }
    return pathname;
  })();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Set cookie so middleware respects the choice on next navigation
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;

    const basePath = pathnameWithoutLocale;

    if (newLocale === defaultLocale) {
      // Switch to zh-TW: remove prefix
      router.push(basePath);
    } else {
      // Switch to non-default: add prefix
      router.push(`/${newLocale}${basePath}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/60 dark:bg-black/60 border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={lp("/")}
          className="text-base font-light tracking-[0.3em] text-black dark:text-white"
        >
          OH
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map(({ path, labelKey }) => {
            const isActive =
              path === "/"
                ? pathnameWithoutLocale === "/"
                : pathnameWithoutLocale.startsWith(path);

            return (
              <Link
                key={path}
                href={lp(path)}
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
          {/* Language switcher */}
          <button
            onClick={() =>
              switchLocale(currentLocale === "en" ? "zh-TW" : "en")
            }
            className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
            title={currentLocale === "en" ? "切換至中文" : "Switch to English"}
          >
            {currentLocale === "en" ? "中文" : "EN"}
          </button>
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
