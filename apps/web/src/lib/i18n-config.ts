// Server-safe locale configuration (no browser APIs)
// Used by middleware, layouts, and server components

export const defaultLocale = "zh-TW" as const;
export const locales = ["zh-TW", "en"] as const;
export type Locale = (typeof locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

/**
 * Get the path prefix for a locale.
 * Default locale (zh-TW) has no prefix, others get /{locale} prefix.
 */
export function getLocalePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}
