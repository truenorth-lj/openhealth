import type { Metadata } from "next";
import { PricingContent } from "./pricing-content";
import { defaultLocale, type Locale } from "@/lib/i18n-config";

const BASE_URL = "https://openhealth.blog";

interface Props {
  params: Promise<{ locale: string }>;
}

const titles: Record<Locale, string> = {
  "zh-TW": "定價方案 - Open Health",
  en: "Pricing - Open Health",
};

const descriptions: Record<Locale, string> = {
  "zh-TW":
    "Open Health 定價方案：自部署永遠免費，或使用雲端託管版每月 $5 美元。",
  en: "Open Health pricing: self-host for free forever, or use our cloud-hosted version for $5/month.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = (locale as Locale) || defaultLocale;

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      canonical: `${BASE_URL}/pricing`,
      languages: {
        "zh-TW": `${BASE_URL}/pricing`,
        en: `${BASE_URL}/en/pricing`,
      },
    },
  };
}

export default function PricingPage() {
  return <PricingContent />;
}
