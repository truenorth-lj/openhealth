"use client";

import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { InviteLink } from "@/components/coach/invite-link";

export default function CoachDashboardPage() {
  const { t } = useTranslation("coach");
  const { data: session } = useSession();
  const { data: myCode } = trpc.referral.getMyCode.useQuery(undefined, {
    enabled: !!session?.user,
  });

  if (!session?.user) {
    return (
      <div className="py-20 text-center text-sm text-neutral-400">
        {t("auth.pleaseLoginFirst", { ns: "common" })}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-light tracking-wide">{t("dashboard")}</h1>

      {/* Invite section */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          {t("inviteClient")}
        </p>
        <p className="text-sm text-neutral-500 font-light">
          {t("inviteDesc")}
        </p>
        <InviteLink referralCode={myCode?.code ?? null} />
      </div>
    </div>
  );
}
