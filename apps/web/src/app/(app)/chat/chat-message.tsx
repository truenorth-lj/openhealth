import type { UIMessage } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { FoodCreationCard } from "./food-creation-card";
import { ActionConfirmCard } from "./action-confirm-card";

const PROSE_STYLES =
  "prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-light [&_td]:border [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1 [&_.table-wrapper]:overflow-x-auto";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role !== "user" && message.role !== "assistant") return null;
  const isUser = message.role === "user";

  // Collect renderable parts
  const textParts = message.parts?.filter(
    (p): p is Extract<typeof p, { type: "text" }> => p.type === "text"
  ) ?? [];
  const textContent = textParts.map((p) => p.text).join("");

  const CARD_TOOLS = new Set(["createFood", "logWeight", "logWater"]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolParts = (message.parts ?? []).filter((p: any) => {
    if (p.type === "dynamic-tool" && CARD_TOOLS.has(p.toolName)) return true;
    if (typeof p.type === "string" && p.type === "tool-createFood") return true;
    return false;
  });

  const hasToolCards = toolParts.length > 0;

  // Skip assistant messages with no renderable content
  if (!isUser && !textContent && !hasToolCards) return null;

  // User messages — unchanged
  if (isUser) {
    return (
      <div className="flex gap-2 flex-row-reverse">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <User className="h-3.5 w-3.5" strokeWidth={1.5} />
        </div>
        <div className="max-w-[85%] overflow-hidden rounded-2xl px-4 py-2 text-sm font-light bg-foreground text-background">
          <p>{textContent}</p>
        </div>
      </div>
    );
  }

  // Assistant messages — render text + tool cards
  return (
    <div className="flex gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.06]">
        <Bot className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
      </div>
      <div className="flex max-w-[85%] flex-col gap-2">
        {textContent && (
          <div
            className={cn(
              "overflow-hidden rounded-2xl px-4 py-2 text-sm font-light",
              "border border-black/[0.06] dark:border-white/[0.06]"
            )}
          >
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
          </div>
        )}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {toolParts.map((part: any) => {
          const key = part.toolCallId ?? part.id ?? Math.random();
          if (part.toolName === "logWeight" || part.toolName === "logWater") {
            return <ActionConfirmCard key={key} part={part} />;
          }
          return <FoodCreationCard key={key} part={part} />;
        })}
      </div>
    </div>
  );
}
