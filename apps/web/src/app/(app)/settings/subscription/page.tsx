"use client";

import { ArrowLeft, Crown } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function SubscriptionPage() {
  const { t } = useTranslation("settings");
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-light tracking-wide">{t("subscription")}</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Crown className="h-12 w-12 text-amber-500/50" />
        <p className="text-lg font-light text-neutral-400">{t("subscriptionPage.comingSoon")}</p>
        <p className="text-sm text-neutral-400/70 text-center max-w-xs">
          {t("subscriptionPage.paymentDeveloping")}
        </p>
      </div>
    </div>
  );
}
