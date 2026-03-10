"use client";

import { useParams } from "next/navigation";
import { defaultLocale } from "@/lib/i18n-config";

/**
 * Returns a locale-aware path for public pages.
 * If current locale is zh-TW (default), returns path as-is.
 * If current locale is en, prefixes with /en.
 *
 * Only use for links between public pages (landing, blog, docs, privacy).
 * Dashboard routes (/hub, /settings) don't need locale prefix.
 */
export function useLocalePath() {
  const params = useParams();
  const locale = params?.locale as string | undefined;

  return (path: string): string => {
    if (!locale || locale === defaultLocale) return path;
    return `/${locale}${path}`;
  };
}
