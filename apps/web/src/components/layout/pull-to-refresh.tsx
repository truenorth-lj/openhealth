"use client";

import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type TouchEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";

const THRESHOLD = 80;
const MAX_PULL = 120;
const RESISTANCE = 0.4;

type PullState = "idle" | "pulling" | "ready" | "refreshing";

export function PullToRefresh({
  children,
  onRefresh,
}: {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pullState, setPullState] = useState<PullState>("idle");
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (pullState === "refreshing") return;
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    },
    [pullState]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || pullState === "refreshing") return;
      if (window.scrollY > 0) {
        pulling.current = false;
        setPullDistance(0);
        setPullState("idle");
        return;
      }

      const delta = (e.touches[0].clientY - startY.current) * RESISTANCE;
      if (delta <= 0) {
        setPullDistance(0);
        setPullState("idle");
        return;
      }

      const distance = Math.min(delta, MAX_PULL);
      setPullDistance(distance);
      setPullState(distance >= THRESHOLD ? "ready" : "pulling");
    },
    [pullState]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || pullState === "refreshing") return;
    pulling.current = false;

    if (pullState === "ready") {
      setPullState("refreshing");
      setPullDistance(THRESHOLD / 2);

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          router.refresh();
          // Give time for the refresh to propagate
          await new Promise((r) => setTimeout(r, 500));
        }
      } finally {
        setPullState("idle");
        setPullDistance(0);
      }
    } else {
      setPullState("idle");
      setPullDistance(0);
    }
  }, [pullState, onRefresh, router]);

  const isAnimating = pullState === "idle" || pullState === "refreshing";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicator */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: pullDistance,
          transition: isAnimating ? "height 0.3s ease" : "none",
        }}
      >
        {pullState === "pulling" && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowDown className="h-4 w-4" />
            <span>{t("pullToRefresh.pull")}</span>
          </div>
        )}
        {pullState === "ready" && (
          <div className="flex items-center gap-1.5 text-sm text-primary">
            <ArrowUp className="h-4 w-4" />
            <span>{t("pullToRefresh.release")}</span>
          </div>
        )}
        {pullState === "refreshing" && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("pullToRefresh.refreshing")}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(0)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
