"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { deleteChatSession } from "@/server/actions/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  RotateCcw,
  Loader2,
  Bot,
  User,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

const MAX_USER_MESSAGES_PER_CONVERSATION = 5;

function ChatDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [input, setInput] = useState("");
  const initSentRef = useRef(false);

  const sessionId = params.id;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ sessionId }),
      }),
    [sessionId]
  );

  const utils = trpc.useUtils();

  // Load existing messages for this session
  const { data: existingMessages, isLoading: isLoadingMessages } =
    trpc.chat.getMessages.useQuery(
      { sessionId },
      { enabled: !!session?.user }
    );

  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!existingMessages) return [];
    return existingMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      parts: (msg.parts as UIMessage["parts"]) ?? [
        { type: "text" as const, text: msg.content },
      ],
    }));
  }, [existingMessages]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
  } = useChat({
    id: sessionId,
    transport,
    onFinish: () => {
      utils.chat.getDailyUsage.invalidate();
      utils.chat.listSessions.invalidate();
    },
  });

  // Sync DB messages into useChat when they load
  const messagesSyncedRef = useRef(false);
  useEffect(() => {
    if (initialMessages.length > 0 && !messagesSyncedRef.current) {
      messagesSyncedRef.current = true;
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  const { data: dailyUsage } = trpc.chat.getDailyUsage.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Handle init message from search params (first message flow)
  const initMessage = searchParams.get("init");
  useEffect(() => {
    if (initMessage && !initSentRef.current && !isLoadingMessages) {
      initSentRef.current = true;
      sendMessage({ text: initMessage });
      // Clear the search param without adding to history
      router.replace(`/chat/${sessionId}`, { scroll: false });
    }
  }, [initMessage, isLoadingMessages, sendMessage, router, sessionId]);

  const isLoading = status === "submitted" || status === "streaming";
  const hasError = status === "error";

  if (isPending || isLoadingMessages) {
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
        <p className="text-sm font-light text-neutral-400">請先登入以使用 AI 營養顧問</p>
      </div>
    );
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isConversationLimitReached =
    userMessageCount >= MAX_USER_MESSAGES_PER_CONVERSATION;
  const isDailyLimitReached =
    dailyUsage && dailyUsage.used >= dailyUsage.limit;
  const dailyRemaining = dailyUsage
    ? dailyUsage.limit - dailyUsage.used
    : null;

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || isDailyLimitReached) return;
    setInput("");
    sendMessage({ text });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleDelete = async () => {
    await deleteChatSession(sessionId);
    utils.chat.listSessions.invalidate();
    router.push("/chat");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Top bar */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.06] px-4 py-2">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-light text-neutral-400 transition-all duration-300 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            返回
          </button>
          <div className="flex items-center gap-2">
            {dailyRemaining !== null && (
              <span className="text-xs font-light text-neutral-400">
                今日剩餘 {dailyRemaining} 次
              </span>
            )}
            <button
              onClick={() => router.push("/chat")}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-light text-neutral-400 transition-all duration-300 hover:text-foreground"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              新對話
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-neutral-300 dark:text-neutral-700 transition-all duration-300 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-lg space-y-4">
          {messages.map((message) => {
            if (message.role !== "user" && message.role !== "assistant")
              return null;
            const isUser = message.role === "user";

            const textContent =
              message.parts
                ?.filter(
                  (p): p is Extract<typeof p, { type: "text" }> =>
                    p.type === "text"
                )
                .map((p) => p.text)
                .join("") ?? "";

            if (!isUser && !textContent) return null;

            return (
              <div
                key={message.id}
                className={cn("flex gap-2", isUser && "flex-row-reverse")}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isUser
                      ? "bg-foreground text-background"
                      : "border border-black/[0.06] dark:border-white/[0.06]"
                  )}
                >
                  {isUser ? (
                    <User className="h-3.5 w-3.5" strokeWidth={1.5} />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[85%] overflow-hidden rounded-2xl px-4 py-2 text-sm font-light",
                    isUser
                      ? "bg-foreground text-background"
                      : "border border-black/[0.06] dark:border-white/[0.06]"
                  )}
                >
                  {isUser ? (
                    <p>{textContent}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-light [&_td]:border [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1 [&_.table-wrapper]:overflow-x-auto">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children }) => (
                            <div className="table-wrapper overflow-x-auto">
                              <table>{children}</table>
                            </div>
                          ),
                        }}
                      >
                        {textContent}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.06]">
                <Bot className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] px-4 py-2 text-sm font-light text-neutral-400">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                正在分析...
              </div>
            </div>
          )}

          {hasError && error && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-destructive/20">
                <Bot className="h-3.5 w-3.5 text-destructive" strokeWidth={1.5} />
              </div>
              <div className="max-w-[85%] rounded-2xl border border-destructive/20 px-4 py-2 text-sm font-light text-destructive">
                {error.message?.includes("429")
                  ? `已達每日訊息上限（${dailyUsage?.limit ?? 100} 則），明天再來吧！`
                  : "發生錯誤，請重試"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06] bg-background px-4 py-3">
        <div className="mx-auto max-w-lg">
          {isConversationLimitReached || isDailyLimitReached ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-light text-neutral-400">
                {isDailyLimitReached
                  ? `已達每日訊息上限（${dailyUsage?.limit ?? 100} 則）`
                  : `已達到對話上限（${MAX_USER_MESSAGES_PER_CONVERSATION} 則）`}
              </p>
              {!isDailyLimitReached && (
                <button
                  onClick={() => router.push("/chat")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-lg transition-all duration-300 hover:border-foreground/20"
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
                  開始新對話
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="輸入你的飲食問題..."
                className="flex-1 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-4 py-2.5 text-sm font-light outline-none transition-all duration-300 focus:border-foreground/20 placeholder:text-neutral-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all duration-300 hover:opacity-80 disabled:opacity-30"
              >
                <Send className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" strokeWidth={1.5} />
        </div>
      }
    >
      <ChatDetail />
    </Suspense>
  );
}
