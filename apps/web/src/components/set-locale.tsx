"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Syncs i18next language and <html lang> attribute with the URL locale param.
 * Rendered inside [locale]/layout.tsx for public pages.
 */
export function SetLocale({ locale }: { locale: string }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    document.documentElement.lang = locale;
  }, [locale, i18n]);

  return null;
}
