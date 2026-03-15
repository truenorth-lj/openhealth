import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Open Health — Your Open-Source Health AI Agent",
  description:
    "第一個開源、行動優先的個人健康 AI Agent。理解你的飲食、睡眠、運動與體重，成為最認識你的健康小助手。",
  manifest: "/manifest.json",
  metadataBase: new URL("https://openhealth.blog"),
  openGraph: {
    title: "Open Health — Your Open-Source Health AI Agent",
    description:
      "第一個開源、行動優先的個人健康 AI Agent。理解你的飲食、睡眠、運動與體重，成為最認識你的健康小助手。",
    url: "https://openhealth.blog",
    siteName: "Open Health",
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Health — Your Open-Source Health AI Agent",
    description:
      "第一個開源、行動優先的個人健康 AI Agent。成為最認識你的健康小助手。",
  },
  keywords: [
    "health AI agent",
    "personal health AI",
    "open source health AI",
    "AI health assistant",
    "nutrition tracking",
    "sleep tracking",
    "fitness tracking",
    "self-hosted health",
    "mobile-first health app",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Open Health",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const locale = headersList.get("x-locale") || "zh-TW";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
