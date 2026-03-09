import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Open Health — All-in-One Health OS",
  description:
    "開放的健康作業系統。飲食、運動、睡眠、體重——所有健康數據整合在一個開源平台，由 AI 驅動，完全屬於你。",
  manifest: "/manifest.json",
  metadataBase: new URL("https://openhealth.blog"),
  openGraph: {
    title: "Open Health — All-in-One Health OS",
    description:
      "開放的健康作業系統。飲食、運動、睡眠、體重——所有健康數據整合在一個開源平台，由 AI 驅動，完全屬於你。",
    url: "https://openhealth.blog",
    siteName: "Open Health",
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Health — All-in-One Health OS",
    description:
      "開放的健康作業系統。飲食、運動、睡眠、體重——所有健康數據整合在一個平台。",
  },
  keywords: [
    "health os",
    "all in one health tracking",
    "open source health platform",
    "AI health assistant",
    "nutrition tracking",
    "sleep tracking",
    "fitness tracking",
    "self-hosted health",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
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
