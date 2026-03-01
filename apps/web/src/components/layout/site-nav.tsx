import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/60 dark:bg-black/60 border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-light tracking-[0.3em] text-black dark:text-white"
        >
          OH
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400 dark:text-neutral-500">
          <Link
            href="/blog"
            className="hover:text-black dark:hover:text-white transition-colors duration-300"
          >
            部落格
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/diary"
            className="text-sm text-black dark:text-white hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-300"
          >
            開始使用 →
          </Link>
        </div>
      </div>
    </nav>
  );
}
