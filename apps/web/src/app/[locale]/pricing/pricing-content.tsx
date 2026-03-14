"use client";

import { Check, X, Cloud, Server, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SiteNav } from "@/components/layout/site-nav";
import Link from "next/link";

type FeatureValue = boolean | string;

interface FeatureRow {
  key: string;
  free: FeatureValue;
  pro: FeatureValue;
  selfHosted: FeatureValue;
}

const featureRows: FeatureRow[] = [
  { key: "foodDiary", free: true, pro: true, selfHosted: true },
  { key: "foodSearch", free: true, pro: true, selfHosted: true },
  { key: "weightTracking", free: true, pro: true, selfHosted: true },
  { key: "waterTracking", free: true, pro: true, selfHosted: true },
  { key: "sleepTracking", free: true, pro: true, selfHosted: true },
  { key: "aiOcr", free: "3/day", pro: "unlimited", selfHosted: true },
  { key: "aiEstimate", free: "3/day", pro: "unlimited", selfHosted: true },
  { key: "aiChat", free: "10/day", pro: "100/day", selfHosted: true },
  { key: "micronutrients", free: false, pro: true, selfHosted: true },
  { key: "exercise", free: false, pro: true, selfHosted: true },
  { key: "fasting", free: false, pro: true, selfHosted: true },
  { key: "progressPhotos", free: false, pro: true, selfHosted: true },
  { key: "exportData", free: false, pro: true, selfHosted: true },
  { key: "savedMeals", free: false, pro: true, selfHosted: true },
];

function FeatureCell({ value, t }: { value: FeatureValue; t: (key: string) => string }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-green-500 mx-auto" strokeWidth={2} />;
  }
  if (value === false) {
    return <X className="h-4 w-4 text-neutral-300 dark:text-neutral-600 mx-auto" strokeWidth={2} />;
  }
  if (value === "unlimited") {
    return <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t("features.unlimited")}</span>;
  }
  // e.g. "3/day", "10/day", "100/day"
  return <span className="text-xs text-neutral-500">{value}</span>;
}

export function PricingContent() {
  const { t } = useTranslation("pricing");

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <SiteNav />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight">
            {t("title")}
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-light max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* 3-Column Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {/* Free */}
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Cloud className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />
                <span className="text-sm font-medium tracking-wide uppercase text-neutral-500">
                  {t("free.badge")}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light">{t("free.price")}</span>
              </div>
              <p className="text-sm text-neutral-400 font-light">
                {t("free.description")}
              </p>
            </div>

            <Link
              href="/hub"
              className="flex w-full items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/[0.08] py-3 text-sm font-medium transition-all duration-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              {t("free.cta")}
            </Link>
          </div>

          {/* Pro — highlighted */}
          <div className="relative rounded-2xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/[0.05] to-transparent p-8 space-y-6">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-amber-500 px-4 py-1 text-xs font-semibold text-white">
                {t("pro.popular")}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                <span className="text-sm font-medium tracking-wide uppercase text-amber-600 dark:text-amber-400">
                  {t("pro.badge")}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light">{t("pro.price")}</span>
                <span className="text-sm text-neutral-400 font-light">
                  / {t("pro.month")}
                </span>
              </div>
              <p className="text-sm text-neutral-400 font-light">
                {t("pro.description")}
              </p>
            </div>

            <Link
              href="/hub"
              className="flex w-full items-center justify-center rounded-lg bg-amber-500 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-amber-600"
            >
              {t("pro.cta")}
            </Link>
          </div>

          {/* Self-Hosted — coming soon */}
          <div className="relative rounded-2xl border border-black/[0.08] dark:border-white/[0.08] p-8 space-y-6">
            <div className="absolute -top-3 right-6">
              <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 border border-black/[0.08] dark:border-white/[0.08] px-3 py-1 text-xs font-medium text-neutral-500">
                {t("selfHosted.comingSoon")}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Server className="h-5 w-5 text-neutral-500" strokeWidth={1.5} />
                <span className="text-sm font-medium tracking-wide uppercase text-neutral-500">
                  {t("selfHosted.badge")}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light">{t("selfHosted.price")}</span>
              </div>
              <p className="text-sm text-neutral-400 font-light">
                {t("selfHosted.description")}
              </p>
            </div>

            <button
              disabled
              className="flex w-full items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/[0.08] py-3 text-sm font-light text-neutral-400 cursor-not-allowed"
            >
              {t("selfHosted.comingSoon")}
            </button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-light text-center mb-8">
            {t("features.title")}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.08] dark:border-white/[0.08]">
                  <th className="text-left py-4 pr-4 font-medium text-neutral-500 w-[40%]" />
                  <th className="py-4 px-4 font-medium text-neutral-500 text-center w-[20%]">
                    {t("free.badge")}
                  </th>
                  <th className="py-4 px-4 font-semibold text-amber-600 dark:text-amber-400 text-center w-[20%]">
                    {t("pro.badge")}
                  </th>
                  <th className="py-4 px-4 font-medium text-neutral-500 text-center w-[20%]">
                    {t("selfHosted.badge")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-black/[0.04] dark:border-white/[0.04]"
                  >
                    <td className="py-3.5 pr-4 font-light">
                      {t(`features.${row.key}`)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <FeatureCell value={row.free} t={t} />
                    </td>
                    <td className="py-3.5 px-4 text-center bg-amber-500/[0.02]">
                      <FeatureCell value={row.pro} t={t} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <FeatureCell value={row.selfHosted} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ / Bottom */}
        <div className="mt-20 text-center space-y-3">
          <p className="text-sm text-neutral-400 font-light">
            {t("faq.openSource")}
          </p>
          <Link
            href="/hub"
            className="inline-block text-sm text-black dark:text-white hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-300"
          >
            {t("faq.tryNow")}
          </Link>
        </div>
      </main>
    </div>
  );
}
