"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { createChatSession, deleteChatSession } from "@/server/actions/chat";
import {
  Send,
  Loader2,
  Bot,
  Trash2,
  Crown,
} from "lucide-react";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import posthog from "posthog-js";
import { useTranslation } from "react-i18next";

export default function ChatPage() {
  const { t } = useTranslation("ai");
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const utils = trpc.useUtils();

  const { data: sessionsData } = trpc.chat.listSessions.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const { data: dailyUsage } = trpc.chat.getDailyUsage.useQuery(undefined, {
    enabled: !!session?.user,
  });

  if (isPending) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" strokeWidth={1.5} />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4 px-4">
        <Bot className="h-10 w-10 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
        <p className="text-sm font-light text-neutral-400">{t("loginRequired")}</p>
      </div>
    );
  }

  const isDailyLimitReached =
    dailyUsage && dailyUsage.used >= dailyUsage.limit;
  const dailyRemaining = dailyUsage
    ? dailyUsage.limit - dailyUsage.used
    : null;

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending || isDailyLimitReached) return;
    setIsSending(true);
    setSendError(null);
    let newSession: { id: string };
    try {
      newSession = await createChatSession({
        title: text.slice(0, 50),
      });
    } catch {
      setIsSending(false);
      setSendError(t("cannotCreateChat"));
      return;
    }
    posthog.capture("chat_session_created");
    router.push(`/hub/chat/${newSession.id}?init=${encodeURIComponent(text)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();
    await deleteChatSession(id);
    utils.chat.listSessions.invalidate();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Top bar */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.06] px-4 py-2">
        <div className="mx-auto flex max-w-lg items-center justify-end">
          {dailyRemaining !== null && (
            <span className="text-xs font-light text-neutral-400">
              {t("dailyRemaining", { count: dailyRemaining })}
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-lg">
          {/* Empty state with quick prompts */}
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex flex-col items-center gap-2">
              <Bot className="h-8 w-8 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
              <h2 className="text-base font-light">{t("aiNutritionAdvisor")}</h2>
              <p className="text-center text-sm font-light text-neutral-400">
                {t("aiAdvisorDesc")}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {(["analyzeDiet", "fatTooHigh", "planTomorrow"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSend(t(`quickPrompts.${key}`))}
                  disabled={isSending}
                  className="border border-black/[0.06] dark:border-white/[0.06] px-4 py-3 text-left text-sm font-light transition-all duration-300 hover:border-foreground/20 hover:pl-5 rounded-lg disabled:opacity-50"
                >
                  {t(`quickPrompts.${key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* History list */}
          {sessionsData && sessionsData.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-light text-neutral-400">{t("chatHistory")}</h3>
              <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
                {sessionsData.map((s) => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/hub/chat/${s.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") router.push(`/hub/chat/${s.id}`);
                    }}
                    className="flex w-full items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] px-1 py-3.5 text-left transition-all duration-300 hover:pl-2 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-light">
                        {s.title || t("newChat")}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-600">
                        {new Date(s.updatedAt).toLocaleDateString("zh-TW", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="ml-2 p-1.5 text-neutral-300 dark:text-neutral-700 transition-all duration-300 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06] bg-background px-4 py-3">
        <div className="mx-auto max-w-lg">
          {sendError && (
            <p className="mb-2 text-center text-sm font-light text-destructive">
              {sendError}
            </p>
          )}
          {isDailyLimitReached ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-light text-neutral-400">
                {t("dailyLimitReached", { limit: dailyUsage?.limit ?? 10 })}
              </p>
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-1.5 text-sm font-light text-amber-600 hover:text-amber-500 transition-colors"
              >
                <Crown className="h-4 w-4" />
                {t("upgradePro")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("inputPlaceholder")}
                className="flex-1 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-4 py-2.5 text-sm font-light outline-none transition-all duration-300 focus:border-foreground/20 placeholder:text-neutral-400"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all duration-300 hover:opacity-80 disabled:opacity-30"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                ) : (
                  <Send className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
