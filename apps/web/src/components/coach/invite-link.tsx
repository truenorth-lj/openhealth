"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react";

export function InviteLink({ referralCode }: { referralCode: string | null }) {
  const { t } = useTranslation("coach");
  const [copied, setCopied] = useState(false);

  if (!referralCode) {
    return (
      <p className="text-sm text-neutral-400">
        {t("noReferralCode")}
      </p>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-black/[0.06] dark:border-white/[0.06] px-4 py-2.5">
        <span className="text-sm font-mono tracking-widest">{referralCode}</span>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg border border-black/[0.06] dark:border-white/[0.06] px-3 py-2.5 text-sm font-light text-neutral-500 transition-all hover:text-foreground hover:border-foreground/20"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" strokeWidth={1.5} />
            {t("copied")}
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" strokeWidth={1.5} />
            {t("copy")}
          </>
        )}
      </button>
    </div>
  );
}
