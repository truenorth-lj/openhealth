import type { Metadata } from "next";
import { DocsContent } from "./docs-content";

export const metadata: Metadata = {
  title: "使用指南 — Open Health",
  description: "了解如何將 Open Health 安裝到你的裝置、開啟通知提醒。支援 iOS、Android 與桌面瀏覽器。",
};

export default function DocsPage() {
  return <DocsContent />;
}
