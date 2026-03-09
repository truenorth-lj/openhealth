"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc-client";
import Link from "next/link";

const PAGE_SIZE = 20;

const infiniteOpts = {
  getNextPageParam: (lastPage: unknown[], allPages: unknown[][]) =>
    lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  initialCursor: 0,
};

export default function FoodBrowsePage() {
  const [query, setQuery] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const searchQuery = trpc.food.search.useInfiniteQuery(
    { query, limit: PAGE_SIZE },
    { enabled: query.length >= 1, ...infiniteOpts }
  );

  const globalPopularQuery = trpc.food.getGlobalPopular.useInfiniteQuery(
    { limit: PAGE_SIZE },
    { staleTime: 10 * 60 * 1000, ...infiniteOpts }
  );

  const activeQuery = query.length >= 1 ? searchQuery : globalPopularQuery;
  const displayFoods = activeQuery.data?.pages.flat() ?? [];
  const isLoadingInitial = activeQuery.isLoading;

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = activeQuery;
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const sectionLabel = query.length >= 1 ? "搜尋結果" : "熱門食物";

  return (
    <div className="px-4 py-6 pb-4">
      <h1 className="text-xl font-light tracking-wide mb-4">食物資料庫</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" strokeWidth={1.5} />
        <Input
          placeholder="搜尋食物..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 border-black/[0.06] dark:border-white/[0.06] font-light"
          autoFocus
        />
      </div>

      <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600 mb-3">
        {sectionLabel}
      </p>

      {isLoadingInitial ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-900" />
          ))}
        </div>
      ) : displayFoods.length > 0 ? (
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
          {displayFoods.map((food) => (
            <Link
              key={food.id}
              href={`/hub/food/${food.id}`}
              className="flex items-center justify-between py-3 border-b border-black/[0.04] dark:border-white/[0.04] transition-all duration-200 hover:pl-1"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-light truncate">{food.name}</p>
                <p className="text-xs font-light text-neutral-400">
                  {food.servingSize}
                  {food.servingUnit}
                  {food.brand ? ` · ${food.brand}` : ""}
                </p>
              </div>
              <div className="ml-3 text-right">
                <p className="text-sm font-light tabular-nums">
                  {Math.round(Number(food.calories))}
                </p>
                <p className="text-[10px] text-neutral-400">kcal</p>
              </div>
            </Link>
          ))}

          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" strokeWidth={1.5} />
            )}
          </div>
        </div>
      ) : query.length >= 1 ? (
        <div className="text-center py-8">
          <p className="text-sm font-light text-neutral-400">找不到「{query}」</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm font-light text-neutral-400">尚無食物資料</p>
        </div>
      )}
    </div>
  );
}
