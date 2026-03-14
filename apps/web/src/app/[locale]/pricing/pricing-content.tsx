"use client";

import { Check, Server, Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SiteNav } from "@/components/layout/site-nav";
import Link from "next/link";

export function PricingContent() {
  const { t } = useTranslation("pricing");

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <SiteNav />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight">
            {t("title")}
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-light max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Cloud — available now */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.03] to-transparent p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Cloud className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                <span className="text-sm font-medium tracking-wide uppercase text-amber-600 dark:text-amber-400">
                  {t("cloud.badge")}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light">$5</span>
                <span className="text-sm text-neutral-400 font-light">
                  / {t("cloud.month")}
                </span>
              </div>
              <p className="text-sm text-neutral-400 font-light">
                {t("cloud.description")}
              </p>
            </div>

            <ul className="space-y-3">
              {(
                [
                  "allFeatures",
                  "zeroSetup",
                  "autoBackup",
                  "autoUpdates",
                  "prioritySupport",
                ] as const
              ).map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <Check
                    className="h-4 w-4 mt-0.5 text-amber-500 shrink-0"
                    strokeWidth={2}
                  />
                  <span className="text-sm font-light">
                    {t(`cloud.features.${key}`)}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/hub"
              className="flex w-full items-center justify-center rounded-lg bg-amber-500 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-amber-600"
            >
              {t("cloud.cta")}
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

            <ul className="space-y-3">
              {(
                [
                  "allFeatures",
                  "ownData",
                  "ownAiKeys",
                  "communitySupport",
                  "unlimitedUsers",
                ] as const
              ).map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <Check
                    className="h-4 w-4 mt-0.5 text-green-500 shrink-0"
                    strokeWidth={2}
                  />
                  <span className="text-sm font-light">
                    {t(`selfHosted.features.${key}`)}
                  </span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="flex w-full items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/[0.08] py-3 text-sm font-light text-neutral-400 cursor-not-allowed"
            >
              {t("selfHosted.comingSoon")}
            </button>
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
