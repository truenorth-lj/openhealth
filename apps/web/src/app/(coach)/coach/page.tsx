"use client";

import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { ClientCard } from "@/components/coach/client-card";
import { InviteLink } from "@/components/coach/invite-link";
import { Users } from "lucide-react";

export default function CoachDashboardPage() {
  const { data: session } = useSession();
  const { data: clients, isLoading } = trpc.coach.getClients.useQuery(
    undefined,
    { enabled: !!session?.user }
  );
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light tracking-wide">教練儀表板</h1>
      </div>

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

      {/* Client list */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          學員列表 ({clients?.length ?? 0})
        </p>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-neutral-400">
            載入中...
          </div>
        ) : !clients?.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-neutral-400">
            <Users className="h-8 w-8" strokeWidth={1} />
            <p className="text-sm font-light">尚無學員</p>
            <p className="text-xs">分享你的推薦碼來邀請學員加入</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                clientId={client.clientId}
                name={client.clientName}
                email={client.clientEmail}
                image={client.clientImage}
                startDate={client.startDate}
                latestWeight={client.latestWeight}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
