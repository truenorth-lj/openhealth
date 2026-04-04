"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc-client";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  Paperclip,
  X,
  Loader2,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  checkup: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  blood_donation: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medical_visit: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  prescription: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  vaccination: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  lab_report: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  other: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
};

function DocumentDetailContent() {
  const { t } = useTranslation(["documents", "common"]);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: doc, isLoading } = trpc.healthDocuments.getById.useQuery({ id });
  const deleteMutation = trpc.healthDocuments.delete.useMutation();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id });
      await utils.healthDocuments.invalidate();
      router.push("/hub/documents");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-24 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-neutral-500">Document not found</p>
        <Link href="/hub/documents" className="mt-2 text-sm text-primary underline">
          {t("documents:back")}
        </Link>
      </div>
    );
  }

  const imageFiles = doc.files.filter((f) => f.fileType.startsWith("image/"));
  const otherFiles = doc.files.filter((f) => !f.fileType.startsWith("image/"));

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/hub/documents"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-light tracking-wide truncate">
            {doc.title}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/hub/documents/${id}/edit`}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Pencil className="h-4 w-4 text-neutral-500" />
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.other,
            )}
          >
            {t(`documents:categories.${doc.category}`)}
          </span>
          <span className="text-sm text-neutral-500">{doc.date}</span>
        </div>

        {doc.note && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
            {doc.note}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span>
            {t("documents:created")} {new Date(doc.createdAt).toLocaleDateString()}
          </span>
          {doc.updatedAt !== doc.createdAt && (
            <span>
              {t("documents:updated")} {new Date(doc.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      {imageFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <Paperclip className="h-3 w-3" />
            {t("documents:fileCount", { count: doc.files.length })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {imageFiles.map((file, i) => (
              <button
                key={file.id}
                onClick={() => setLightboxIndex(i)}
                className="aspect-[4/3] overflow-hidden rounded-lg border border-black/[0.06] dark:border-white/[0.06] transition-all hover:shadow-md"
              >
                <img
                  src={file.fileUrl}
                  alt={file.fileName}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Other Files */}
      {otherFiles.length > 0 && (
        <div className="space-y-2">
          {otherFiles.map((file) => (
            <a
              key={file.id}
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <FileText className="h-5 w-5 text-neutral-400" />
              <span className="flex-1 truncate text-sm">{file.fileName}</span>
              <Download className="h-4 w-4 text-neutral-400" />
            </a>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={imageFiles[lightboxIndex].fileUrl}
            alt={imageFiles[lightboxIndex].fileName}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {/* Prev/Next */}
          {imageFiles.length > 1 && (
            <div
              className="absolute bottom-6 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {imageFiles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i === lightboxIndex
                      ? "bg-white"
                      : "bg-white/40 hover:bg-white/60",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl space-y-4">
            <p className="text-sm">{t("documents:deleteConfirm")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-black/[0.06] dark:border-white/[0.06] py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {t("common:buttons.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  t("documents:delete")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
      }
    >
      <DocumentDetailContent />
    </Suspense>
  );
}
