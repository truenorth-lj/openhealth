"use client";

import dynamic from "next/dynamic";

const PwaInstallBanner = dynamic(
  () => import("@/components/pwa-install-banner").then((m) => m.PwaInstallBanner),
  { ssr: false }
);

const WaterReminderProvider = dynamic(
  () => import("@/components/water-reminder-provider").then((m) => m.WaterReminderProvider),
  { ssr: false }
);

export function DeferredProviders() {
  return (
    <>
      <PwaInstallBanner />
      <WaterReminderProvider />
    </>
  );
}
