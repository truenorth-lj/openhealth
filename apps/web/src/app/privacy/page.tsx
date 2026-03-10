import type { Metadata } from "next";
import { PrivacyContent } from "./privacy-content";

export const metadata: Metadata = {
  title: "隱私權政策 - Open Health",
  description: "Open Health 隱私權政策——說明我們如何收集、使用與保護你的健康數據與個人資料。",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
