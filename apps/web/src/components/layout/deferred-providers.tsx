"use client";

import dynamic from "next/dynamic";

const PwaInstallBanner = dynamic(
  () => import("@/components/pwa-install-banner").then((m) => m.PwaInstallBanner),
  { ssr: false }
);

const WhatsNewModal = dynamic(
  () => import("@/components/whats-new-modal").then((m) => m.WhatsNewModal),
  { ssr: false }
);

export function DeferredProviders() {
  return (
    <>
      <PwaInstallBanner />
      <WhatsNewModal />
    </>
  );
}
