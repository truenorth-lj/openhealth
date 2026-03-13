"use client";

import { ArrowLeft, Crown, Check, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Suspense, useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";

const PRO_FEATURES_KEYS = [
  "unlimitedAI",
  "micronutrients",
  "exercise",
  "fasting",
  "progressPhotos",
  "exportData",
  "savedMeals",
] as const;

function SubscriptionContent() {
  const { t } = useTranslation("settings");
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const { data: subscription, isLoading } = trpc.subscription.getSubscription.useQuery(
    undefined,
    { enabled: !!session?.user }
  );

  const [error, setError] = useState<string | null>(null);

  const checkoutMutation = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => {
      setIsCheckingOut(false);
      setError(err.message);
    },
  });

  const portalMutation = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleUpgrade = () => {
    setIsCheckingOut(true);
    checkoutMutation.mutate({ interval: "monthly" });
  };

  const handleManage = () => {
    portalMutation.mutate();
  };

  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

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

      {/* Success / Canceled banners */}
      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-sm font-light text-green-700 dark:text-green-400">
            {t("subscriptionPage.successMessage")}
          </p>
        </div>
      )}
      {canceled && (
        <div className="rounded-lg border border-neutral-300/30 bg-neutral-100/50 dark:border-neutral-700/30 dark:bg-neutral-800/50 p-4">
          <p className="text-sm font-light text-neutral-500">
            {t("subscriptionPage.canceledMessage")}
          </p>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-light text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
        </div>
      ) : isActive ? (
        /* --- Active subscription --- */
        <div className="space-y-6">
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium tracking-wide">Pro</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-light">
                <span className="text-neutral-500">{t("subscriptionPage.status")}</span>
                <span className="text-green-600 dark:text-green-400">
                  {subscription?.status === "trialing"
                    ? t("subscriptionPage.trialing")
                    : t("subscriptionPage.active")}
                </span>
              </div>
              {subscription?.currentPeriodEnd && (
                <div className="flex justify-between text-sm font-light">
                  <span className="text-neutral-500">
                    {subscription.cancelAtPeriodEnd
                      ? t("subscriptionPage.expiresOn")
                      : t("subscriptionPage.renewsOn")}
                  </span>
                  <span>
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-light">
                {t("subscriptionPage.canceledNote")}
              </p>
            )}
          </div>

          <button
            onClick={handleManage}
            disabled={portalMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/[0.06] dark:border-white/[0.06] py-3 text-sm font-light transition-all duration-300 hover:border-foreground/20 disabled:opacity-50"
          >
            {portalMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
            )}
            {t("subscriptionPage.manageSubscription")}
          </button>
        </div>
      ) : (
        /* --- Free plan / upgrade --- */
        <div className="space-y-6">
          {/* Current plan badge */}
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-5 space-y-1">
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-400">
              {t("subscriptionPage.currentPlan")}
            </p>
            <p className="text-lg font-light">Free</p>
          </div>

          {/* Pro card */}
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-6 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="text-lg font-light">Pro</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-light">$5</span>
                <span className="text-sm text-neutral-400 font-light">
                  / {t("subscriptionPage.month")}
                </span>
              </div>
            </div>

            {/* Feature list */}
            <ul className="space-y-2.5">
              {PRO_FEATURES_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0" strokeWidth={2} />
                  <span className="text-sm font-light">
                    {t(`subscriptionPage.features.${key}`)}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={isCheckingOut}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-amber-600 disabled:opacity-50"
            >
              {isCheckingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isCheckingOut
                ? t("subscriptionPage.redirecting")
                : t("subscriptionPage.upgrade")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
