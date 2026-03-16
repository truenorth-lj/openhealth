import type { Metadata } from "next";
import { SupportContent } from "./support-content";
import { defaultLocale, type Locale } from "@/lib/i18n-config";

const BASE_URL = "https://openhealth.blog";

interface Props {
  params: Promise<{ locale: string }>;
}

const titles: Record<Locale, string> = {
  "zh-TW": "支援中心 — Open Health",
  en: "Support — Open Health",
};

const descriptions: Record<Locale, string> = {
  "zh-TW":
    "需要幫助？查看常見問題、使用指南，或透過 Email 聯繫我們的支援團隊。",
  en: "Need help? Check our FAQ, documentation, or contact our support team via email.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = (locale as Locale) || defaultLocale;

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      canonical: `${BASE_URL}/support`,
      languages: {
        "zh-TW": `${BASE_URL}/support`,
        en: `${BASE_URL}/en/support`,
      },
    },
  };
}

export default function SupportPage() {
  return <SupportContent />;
}
