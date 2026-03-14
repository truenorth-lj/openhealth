import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";
import { DeferredProviders } from "@/components/layout/deferred-providers";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DeferredProviders />
      <PullToRefresh>
        <main className="mx-auto max-w-lg pb-20">{children}</main>
      </PullToRefresh>
      <BottomNav />
    </div>
  );
}
