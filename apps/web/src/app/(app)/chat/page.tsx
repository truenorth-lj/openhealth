"use client";

import { useState, useRef, useMemo } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { createChatSession, deleteChatSession } from "@/server/actions/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  RotateCcw,
  Loader2,
  Bot,
  User,
  History,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_USER_MESSAGES_PER_CONVERSATION = 5;

const quickPrompts = [
  "分析我今天的飲食",
  "我的脂肪攝取是否過高？",
  "幫我規劃明天的飲食",
];

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ sessionId: sessionIdRef.current }),
      }),
    []
  );

  const utils = trpc.useUtils();

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
  } = useChat({
    id: sessionId ?? undefined,
    messages: initialMessages,
    transport,
    onFinish: () => {
      utils.chat.getDailyUsage.invalidate();
      utils.chat.listSessions.invalidate();
    },
  });

  const { data: sessionsData } = trpc.chat.listSessions.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const { data: dailyUsage } = trpc.chat.getDailyUsage.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const hasError = status === "error";

  if (isPending) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4 px-4">
        <Bot className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">請先登入以使用 AI 營養顧問</p>
      </div>
    );
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isConversationLimitReached =
    userMessageCount >= MAX_USER_MESSAGES_PER_CONVERSATION;
  const isDailyLimitReached =
    dailyUsage && dailyUsage.used >= dailyUsage.limit;
  const hasMessages = messages.length > 0;
  const dailyRemaining = dailyUsage
    ? dailyUsage.limit - dailyUsage.used
    : null;

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || isDailyLimitReached) return;
    setInput("");

    // Create session if needed
    if (!sessionIdRef.current) {
      const newSession = await createChatSession({
        title: text.slice(0, 50),
      });
      sessionIdRef.current = newSession.id;
      setSessionId(newSession.id);
    }

    sendMessage({ text });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleNewConversation = () => {
    sessionIdRef.current = null;
    setSessionId(null);
    setMessages([]);
    setInitialMessages([]);
    setShowHistory(false);
  };

  const handleLoadSession = async (id: string) => {
    setShowHistory(false);
    sessionIdRef.current = id;
    setSessionId(id);

    const data = await utils.chat.getMessages.fetch({ sessionId: id });
    const uiMessages: UIMessage[] = data.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      parts: (msg.parts as UIMessage["parts"]) ?? [
        { type: "text" as const, text: msg.content },
      ],
    }));
    setInitialMessages(uiMessages);
    setMessages(uiMessages);
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();
    await deleteChatSession(id);
    utils.chat.listSessions.invalidate();

    // If deleting the current session, reset
    if (sessionIdRef.current === id) {
      handleNewConversation();
    }
  };

  // History list view
  if (showHistory) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="border-b px-4 py-3">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <button
              onClick={() => setShowHistory(false)}
              className="rounded-lg p-1.5 transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">歷史對話</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-lg space-y-2">
            {sessionsData && sessionsData.length > 0 ? (
              sessionsData.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleLoadSession(s.id)}
                  className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {s.title || "新對話"}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
                    className="ml-2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </button>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                尚無歷史對話
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Top bar */}
      <div className="border-b px-4 py-2">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <History className="h-4 w-4" />
              歷史對話
            </button>
          </div>
          <div className="flex items-center gap-2">
            {dailyRemaining !== null && (
              <span className="text-xs text-muted-foreground">
                今日剩餘 {dailyRemaining} 次
              </span>
            )}
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              新對話
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!hasMessages ? (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Bot className="h-10 w-10 text-primary" />
              <h2 className="text-lg font-semibold">AI 營養顧問</h2>
              <p className="text-center text-sm text-muted-foreground">
                我可以分析你的飲食紀錄，提供營養建議
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="rounded-lg border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
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
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {isUser ? (
                      <p>{textContent}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在分析...
                </div>
              </div>
            )}

            {hasError && error && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <Bot className="h-4 w-4 text-destructive" />
                </div>
                <div className="max-w-[85%] rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error.message?.includes("429")
                    ? "已達每日訊息上限（100 則），明天再來吧！"
                    : "發生錯誤，請重試"}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-background px-4 py-3">
        <div className="mx-auto max-w-lg">
          {isConversationLimitReached || isDailyLimitReached ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {isDailyLimitReached
                  ? "已達每日訊息上限（100 則）"
                  : `已達到對話上限（${MAX_USER_MESSAGES_PER_CONVERSATION} 則）`}
              </p>
              {!isDailyLimitReached && (
                <button
                  onClick={handleNewConversation}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <RotateCcw className="h-4 w-4" />
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
                className="flex-1 rounded-full border bg-muted/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-background"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
