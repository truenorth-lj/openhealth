import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "部落格 — Open Health",
  description: "關於健康、營養與生活方式的見解與思考。",
};

export default function BlogPage() {
  return (
    <div className="bg-black text-white min-h-screen selection:bg-white selection:text-black">
      <nav className="border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-base font-light tracking-[0.3em] text-white"
          >
            OH
          </Link>
          <Link
            href="/diary"
            className="text-sm text-neutral-500 hover:text-white transition-colors duration-300"
          >
            開始使用 →
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <p className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase mb-4">
          Journal
        </p>
        <h1 className="text-4xl md:text-5xl font-extralight mb-8">部落格</h1>
        <p className="text-neutral-500 font-light mb-20 max-w-xl text-sm">
          關於健康、營養與生活方式的見解與思考。
        </p>

        {/* Empty state */}
        <div className="border border-white/[0.06] py-24 md:py-32 flex flex-col items-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 120 120"
            fill="none"
            aria-hidden="true"
            className="mb-10 opacity-10"
          >
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="white"
              strokeWidth="1.5"
              strokeDasharray="314"
              strokeDashoffset="30"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-neutral-600 font-light text-sm">即將推出</p>
          <p className="text-neutral-800 font-light text-xs mt-3">
            我們正在撰寫第一篇文章
          </p>
        </div>

        <div className="mt-16 border-t border-white/[0.06] pt-8">
          <Link
            href="/"
            className="text-xs text-neutral-600 hover:text-white transition-colors duration-300 tracking-wider"
          >
            ← 返回首頁
          </Link>
        </div>
      </main>
    </div>
  );
}
