import type { UIMessage } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

const PROSE_STYLES =
  "prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-light [&_td]:border [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1 [&_.table-wrapper]:overflow-x-auto";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role !== "user" && message.role !== "assistant") return null;
  const isUser = message.role === "user";

  const textContent =
    message.parts
      ?.filter(
        (p): p is Extract<typeof p, { type: "text" }> => p.type === "text"
      )
      .map((p) => p.text)
      .join("") ?? "";

  // Skip assistant messages with no text (e.g. tool-call-only steps)
  if (!isUser && !textContent) return null;

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
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
          <div className={PROSE_STYLES}>
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
}
