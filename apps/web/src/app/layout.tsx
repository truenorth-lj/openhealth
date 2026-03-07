import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Open Health — Open Source Health Tracking & AI Nutrition Assistant",
  description:
    "Open source alternative to MyFitnessPal. Track meals, scan nutrition labels with AI, and get personalized dietary insights. Self-hostable and privacy-first.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://openhealth.blog"),
  openGraph: {
    title: "Open Health — Open Source Health Tracking & AI Nutrition Assistant",
    description:
      "Open source alternative to MyFitnessPal. Track meals, scan nutrition labels with AI, and get personalized dietary insights.",
    url: "https://openhealth.blog",
    siteName: "Open Health",
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Health — Open Source Health Tracking",
    description:
      "Open source alternative to MyFitnessPal. Track meals, scan nutrition labels with AI.",
  },
  keywords: [
    "open source health tracker",
    "calorie tracker",
    "nutrition tracking",
    "MyFitnessPal alternative",
    "AI nutrition",
    "food diary",
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
