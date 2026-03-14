import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  fallbackLng,
  defaultNS,
  supportedLngs,
} from "@open-health/shared/i18n";
import { zhTWResources } from "@open-health/shared/i18n/zh-TW";

// Detect language before init to decide which resources to load synchronously
function getInitialLng(): string {
  if (typeof window === "undefined") return fallbackLng;
  const stored = localStorage.getItem("i18nextLng");
  if (stored && supportedLngs.includes(stored as "zh-TW" | "en")) return stored;
  const nav = navigator.language;
  if (nav.startsWith("zh")) return "zh-TW";
  if (nav.startsWith("en")) return "en";
  return fallbackLng;
}

const initialLng = getInitialLng();

// Load zh-TW synchronously (default/fallback, always needed).
// English is loaded on demand to reduce initial bundle size (~48KB savings).
const initialResources: Record<string, typeof zhTWResources> = {
  "zh-TW": zhTWResources,
};

// If user's language is English, load it synchronously on first visit
// (subsequent visits will have it cached by the bundler)
if (initialLng === "en") {
  // This dynamic import is resolved at init time — tiny delay, but only for EN users
  import("@open-health/shared/i18n/en").then(({ enResources }) => {
    Object.entries(enResources).forEach(([ns, bundle]) => {
      i18n.addResourceBundle("en", ns, bundle);
    });
    if (i18n.language === "en") {
      i18n.changeLanguage("en"); // Re-trigger render with loaded resources
    }
  });
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: initialResources,
    fallbackLng,
    defaultNS,
    lng: initialLng,
    supportedLngs: [...supportedLngs],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

// Lazy-load English resources when user switches language
i18n.on("languageChanged", (lng) => {
  if (lng === "en" && !i18n.hasResourceBundle("en", "common")) {
    import("@open-health/shared/i18n/en").then(({ enResources }) => {
      Object.entries(enResources).forEach(([ns, bundle]) => {
        i18n.addResourceBundle("en", ns, bundle);
      });
      i18n.changeLanguage("en");
    });
  }
});

export default i18n;
