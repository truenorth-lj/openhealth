import type { Metadata } from "next";
import { PrivacyContent } from "./privacy-content";
import { defaultLocale, type Locale } from "@/lib/i18n-config";

const BASE_URL = "https://openhealth.blog";

interface Props {
  params: Promise<{ locale: string }>;
}

const titles: Record<Locale, string> = {
  "zh-TW": "隱私權政策 - Open Health",
  en: "Privacy Policy - Open Health",
};

const descriptions: Record<Locale, string> = {
  "zh-TW":
    "Open Health 隱私權政策——說明我們如何收集、使用與保護你的健康數據與個人資料。",
  en: "Open Health Privacy Policy — how we collect, use, and protect your health data and personal information.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = (locale as Locale) || defaultLocale;

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      canonical: `${BASE_URL}/privacy`,
      languages: {
        "zh-TW": `${BASE_URL}/privacy`,
        en: `${BASE_URL}/en/privacy`,
      },
    },
  };
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
