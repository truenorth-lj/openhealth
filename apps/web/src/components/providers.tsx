"use client";

import "@/lib/i18n"; // Initialize i18next (side-effect)
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { ThemeProvider } from "next-themes";
import { trpc } from "@/lib/trpc-client";
import { PostHogProvider } from "@/components/posthog-provider";
import { PostHogPageView } from "@/components/posthog-pageview";
import { MiniKitProvider } from "@/components/minikit-provider";

// Workaround: React 18/19 types mismatch in monorepo causes children prop errors
const Theme = ThemeProvider as React.FC<{
  children: React.ReactNode;
  attribute: string;
  defaultTheme: string;
  enableSystem: boolean;
}>;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    })
  );

  return (
    <MiniKitProvider>
      <PostHogProvider>
        <PostHogPageView />
        <Theme attribute="class" defaultTheme="system" enableSystem={true}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </trpc.Provider>
        </Theme>
      </PostHogProvider>
    </MiniKitProvider>
  );
}
