import type { Metadata } from "next";
import { DocsContent } from "./docs-content";
import { defaultLocale, type Locale } from "@/lib/i18n-config";

const BASE_URL = "https://openhealth.blog";

interface Props {
  params: Promise<{ locale: string }>;
}

const titles: Record<Locale, string> = {
  "zh-TW": "使用指南 — Open Health",
  en: "Documentation — Open Health",
};

const descriptions: Record<Locale, string> = {
  "zh-TW":
    "了解如何將 Open Health 安裝到你的裝置、開啟通知提醒。支援 iOS、Android 與桌面瀏覽器。",
  en: "Learn how to install Open Health on your device and enable notifications. Supports iOS, Android, and desktop browsers.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = (locale as Locale) || defaultLocale;

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      canonical: `${BASE_URL}/docs`,
      languages: {
        "zh-TW": `${BASE_URL}/docs`,
        en: `${BASE_URL}/en/docs`,
      },
    },
  };
}

export default function DocsPage() {
  return <DocsContent />;
}
