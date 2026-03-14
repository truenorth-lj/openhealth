"use client";

import dynamic from "next/dynamic";
import type { PropsWithChildren } from "react";

const MiniKitProviderInner = dynamic(
  () =>
    import("@worldcoin/minikit-js/minikit-provider").then(
      (m) => m.MiniKitProvider
    ),
  { ssr: false }
);

const APP_ID = process.env.NEXT_PUBLIC_WORLD_APP_ID;

export function MiniKitProvider({ children }: PropsWithChildren) {
  if (!APP_ID) return <>{children}</>;

  return (
    <MiniKitProviderInner props={{ appId: APP_ID }}>
      {children}
    </MiniKitProviderInner>
  );
}
