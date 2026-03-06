"use client";

import { Suspense, useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ArrowLeft, Barcode, Camera, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc-client";
import { logFood } from "@/server/actions/diary";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import Link from "next/link";
import { toast } from "sonner";
import posthog from "posthog-js";

const PAGE_SIZE = 20;

const infiniteOpts = {
  getNextPageParam: (lastPage: unknown[], allPages: unknown[][]) =>
    lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  initialCursor: 0,
};

function FoodSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const meal = (searchParams.get("meal") || "snack") as
    | "breakfast"
    | "lunch"
    | "dinner"
    | "snack";

  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingFoodId, setPendingFoodId] = useState<string | null>(null);
  const { isAuthenticated, showLoginDialog, setShowLoginDialog } = useAuthGuard();
  const utils = trpc.useUtils();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Search results (infinite)
  const searchQuery = trpc.food.search.useInfiniteQuery(
    { query, limit: PAGE_SIZE },
    { enabled: query.length >= 1, ...infiniteOpts }
  );

  // User's frequent foods (infinite)
  const frequentQuery = trpc.food.getFrequent.useInfiniteQuery(
    { limit: PAGE_SIZE },
    { enabled: isAuthenticated, staleTime: 5 * 60 * 1000, ...infiniteOpts }
  );

  const hasUserFrequent = frequentQuery.data && frequentQuery.data.pages[0]?.length > 0;

  // Global popular foods (infinite, fallback when no user frequent)
  const globalPopularQuery = trpc.food.getGlobalPopular.useInfiniteQuery(
    { limit: PAGE_SIZE },
    { enabled: !frequentQuery.isLoading && !hasUserFrequent, staleTime: 10 * 60 * 1000, ...infiniteOpts }
  );

  const mealLabels: Record<string, string> = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "點心",
  };

  // Determine which query is active
  const activeQuery = query.length >= 1
    ? searchQuery
    : hasUserFrequent
      ? frequentQuery
      : globalPopularQuery;

  const displayFoods = activeQuery.data?.pages.flat() ?? [];
  const isLoadingInitial = query.length >= 1
    ? searchQuery.isLoading
    : frequentQuery.isLoading || (!hasUserFrequent && globalPopularQuery.isLoading);

  // Intersection Observer for infinite scroll
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

  const doLogFood = (foodId: string) => {
    startTransition(async () => {
      try {
        await logFood({
          date,
          mealType: meal,
          foodId,
          servingQty: 1,
        });
        await utils.diary.getDay.invalidate();
        const food = displayFoods.find((f) => f.id === foodId);
        posthog.capture("food_logged", { source: "search", meal_type: meal, calories: food ? Math.round(Number(food.calories)) : undefined });
        toast.success("已新增到日記");
        router.push(`/diary?date=${date}`);
        router.refresh();
      } catch (err) {
        console.error("logFood failed:", err);
        toast.error("新增失敗，請重試");
      }
    });
  };

  const handleQuickAdd = (foodId: string) => {
    if (!isAuthenticated) {
      setPendingFoodId(foodId);
      setShowLoginDialog(true);
      return;
    }
    doLogFood(foodId);
  };

  const handleLoginSuccess = () => {
    if (pendingFoodId) {
      doLogFood(pendingFoodId);
      setPendingFoodId(null);
    } else {
      router.refresh();
    }
  };

  const sectionLabel = query.length >= 1
    ? "搜尋結果"
    : hasUserFrequent
      ? "常用食物"
      : "最多人使用";

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-3 py-3">
        <Link href={`/diary?date=${date}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold">新增到{mealLabels[meal]}</h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋食物..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-12"
          autoFocus
        />
        <Link
          href={`/food/scan?date=${date}&meal=${meal}`}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Barcode className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <Link href={`/food/create?date=${date}&meal=${meal}`}>
          <Button variant="outline" size="sm">
            自訂食物
          </Button>
        </Link>
        <Link href={`/food/scan-label?date=${date}&meal=${meal}`}>
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-1" />
            拍照辨識
          </Button>
        </Link>
        <Link href={`/food/estimate?date=${date}&meal=${meal}`}>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            AI 估算
          </Button>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground mb-2 px-1">
        {sectionLabel}
      </p>

      {isLoadingInitial ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : displayFoods.length > 0 ? (
        <div className="space-y-1">
          {displayFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => handleQuickAdd(food.id)}
              disabled={isPending}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{food.name}</p>
                <p className="text-xs text-muted-foreground">
                  {food.servingSize}
                  {food.servingUnit}
                  {food.brand ? ` · ${food.brand}` : ""}
                </p>
              </div>
              <div className="ml-3 text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {Math.round(Number(food.calories))}
                </p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            </button>
          ))}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      ) : query.length >= 1 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">找不到「{query}」</p>
          <Link href={`/food/create?date=${date}&meal=${meal}&name=${query}`}>
            <Button variant="link" size="sm" className="mt-2">
              建立自訂食物
            </Button>
          </Link>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">尚無常用食物</p>
          <p className="text-xs mt-1">搜尋並新增食物後會顯示在這裡</p>
        </div>
      )}

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default function FoodSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-4 space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      }
    >
      <FoodSearchContent />
    </Suspense>
  );
}
