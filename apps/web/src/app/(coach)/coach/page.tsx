"use client";

import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { InviteLink } from "@/components/coach/invite-link";

export default function CoachDashboardPage() {
  const { data: session } = useSession();
  const { data: myCode } = trpc.referral.getMyCode.useQuery(undefined, {
    enabled: !!session?.user,
  });

  if (!session?.user) {
    return (
      <div className="py-20 text-center text-sm text-neutral-400">
        請先登入
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-light tracking-wide">教練儀表板</h1>

      {/* Invite section */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          邀請學員
        </p>
        <p className="text-sm text-neutral-500 font-light">
          將你的推薦碼分享給學員，學員在設定中輸入即可加入。
        </p>
        <InviteLink referralCode={myCode?.code ?? null} />
      </div>
    </div>
  );
}
