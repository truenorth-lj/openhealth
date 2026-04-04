"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc-client";
import { Plus, FileText, Paperclip, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEALTH_DOCUMENT_CATEGORIES, type HealthDocumentCategory } from "@open-health/shared/constants";

const CATEGORY_COLORS: Record<HealthDocumentCategory, string> = {
  checkup: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  blood_donation: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medical_visit: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  prescription: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  vaccination: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  lab_report: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  other: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
};

function DocumentsContent() {
  const { t } = useTranslation(["documents", "common"]);
  const [filterCategory, setFilterCategory] = useState<HealthDocumentCategory | undefined>();

  const { data: documents, isLoading } = trpc.healthDocuments.list.useQuery({
    category: filterCategory,
  });

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-light tracking-wide">
          {t("documents:title")}
        </h1>
        <Link
          href="/hub/documents/new"
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t("documents:newDocument")}
        </Link>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterCategory(undefined)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !filterCategory
              ? "bg-foreground text-background"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
          )}
        >
          {t("documents:allCategories")}
        </button>
        {HEALTH_DOCUMENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setFilterCategory(filterCategory === cat ? undefined : cat)
            }
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filterCategory === cat
                ? "bg-foreground text-background"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
            )}
          >
            {t(`documents:categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/hub/documents/${doc.id}`}
              className="group flex items-center gap-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <FileText className="h-5 w-5 text-neutral-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {doc.title}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      CATEGORY_COLORS[doc.category as HealthDocumentCategory] ??
                        CATEGORY_COLORS.other,
                    )}
                  >
                    {t(`documents:categories.${doc.category}`)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                  <span>{doc.date}</span>
                  {doc.fileCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Paperclip className="h-3 w-3" />
                      {doc.fileCount}
                    </span>
                  )}
                  {doc.note && (
                    <span className="truncate max-w-[200px]">{doc.note}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-neutral-300 dark:text-neutral-700" />
          <p className="mt-4 text-sm font-medium text-neutral-500">
            {t("documents:noDocuments")}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {t("documents:noDocumentsHint")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6">
          <div className="h-8 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
