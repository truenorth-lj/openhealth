"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function BlogContent({ content }: { content: string }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-xl font-light mt-12 mb-4 pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-normal mt-8 mb-3 text-neutral-700 dark:text-neutral-200">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="text-sm text-neutral-500 dark:text-neutral-400 font-light space-y-2 mb-4 ml-4 list-disc">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="text-sm text-neutral-500 dark:text-neutral-400 font-light space-y-2 mb-4 ml-4 list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="text-neutral-700 dark:text-neutral-200 font-medium">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-black/[0.1] dark:border-white/[0.1] pl-4 my-4 text-neutral-500 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full text-sm text-neutral-500 dark:text-neutral-400 border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-black/[0.1] dark:border-white/[0.1] text-neutral-700 dark:text-neutral-300">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="text-left py-2 px-3 font-medium text-xs tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="py-2 px-3 border-b border-black/[0.04] dark:border-white/[0.04] font-light">
              {children}
            </td>
          ),
          hr: () => <hr className="border-black/[0.06] dark:border-white/[0.06] my-8" />,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="block bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] p-4 text-xs text-neutral-500 dark:text-neutral-400 overflow-x-auto my-4">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-black/[0.05] dark:bg-white/[0.05] px-1.5 py-0.5 text-xs text-neutral-600 dark:text-neutral-300">
                {children}
              </code>
            );
          },
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt ?? ""}
              className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] my-6 mx-auto max-w-full"
              loading="lazy"
            />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 dark:text-neutral-300 underline underline-offset-2 hover:text-black dark:hover:text-white transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
