import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { PullToRefresh } from "@/components/layout/pull-to-refresh";
import { WaterReminderProvider } from "@/components/water-reminder-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PullToRefresh>
        <main className="mx-auto max-w-lg pb-20">{children}</main>
      </PullToRefresh>
      <BottomNav />
      <WaterReminderProvider />
    </div>
  );
}
