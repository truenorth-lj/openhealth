"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { User, Users, Settings, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function CoachSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const { data: clients, isLoading } = trpc.coach.getClients.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Extract current client ID from pathname
  const currentClientId = pathname.match(/\/coach\/client\/([^/]+)/)?.[1];

  return (
    <aside
      className={cn(
        "sticky top-14 h-[calc(100vh-3.5rem)] border-r border-black/[0.06] dark:border-white/[0.06] bg-background transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-black/[0.06] dark:border-white/[0.06]">
        {!collapsed && !isLoading && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            學員 ({clients?.length ?? 0})
          </p>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Client list */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Dashboard link */}
        <Link
          href="/coach"
          className={cn(
            "flex items-center gap-3 rounded-lg p-2.5 transition-all duration-200",
            pathname === "/coach"
              ? "bg-neutral-100 dark:bg-neutral-800 text-foreground"
              : "text-neutral-500 hover:text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {!collapsed && <span className="text-sm font-light">總覽</span>}
        </Link>

        {/* Divider */}
        <div className="h-px bg-black/[0.04] dark:bg-white/[0.04] my-1" />

        {isLoading ? (
          !collapsed && (
            <div className="py-8 text-center text-xs text-neutral-400">
              載入中...
            </div>
          )
        ) : !clients?.length ? (
          !collapsed && (
            <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
              <Users className="h-5 w-5" strokeWidth={1} />
              <p className="text-xs font-light">尚無學員</p>
            </div>
          )
        ) : (
          clients.map((client) => {
            const isActive = currentClientId === client.clientId;
            return (
              <Link
                key={client.id}
                href={`/coach/client/${client.clientId}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2.5 transition-all duration-200",
                  isActive
                    ? "bg-neutral-100 dark:bg-neutral-800 text-foreground"
                    : "text-neutral-500 hover:text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                )}
                title={collapsed ? client.clientName : undefined}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all",
                    isActive
                      ? "border-foreground/20 bg-foreground/5"
                      : "border-black/[0.06] dark:border-white/[0.06]"
                  )}
                >
                  <User className="h-3.5 w-3.5" strokeWidth={1.5} />
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-light truncate">
                      {client.clientName}
                    </p>
                    {client.latestWeight?.weightKg != null && (
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-600">
                        {Number(client.latestWeight.weightKg).toFixed(1)} kg
                      </p>
                    )}
                  </div>
                )}
              </Link>
            );
          })
        )}
      </nav>
    </aside>
  );
}
