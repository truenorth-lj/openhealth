"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc-client";
import {
  ArrowLeft,
  Upload,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { HEALTH_DOCUMENT_CATEGORIES } from "@open-health/shared/constants";

interface UploadedFile {
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  preview?: string; // local object URL for preview
}

export default function NewDocumentPage() {
  const { t } = useTranslation(["documents", "common"]);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [category, setCategory] = useState<(typeof HEALTH_DOCUMENT_CATEGORIES)[number]>("checkup");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const utils = trpc.useUtils();
  const createMutation = trpc.healthDocuments.create.useMutation();

  const handleFileUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setUploading(true);

      try {
        const newFiles: UploadedFile[] = [];

        for (const file of Array.from(fileList)) {
          if (file.size > 10 * 1024 * 1024) {
            alert(`${file.name} exceeds 10MB limit`);
            continue;
          }

          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "documents");

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            alert(err.error || "Upload failed");
            continue;
          }

          const data = await res.json();
          const preview = file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined;

          newFiles.push({ ...data, preview });
        }

        setFiles((prev) => [...prev, ...newFiles]);
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  const handleSubmit = () => {
    if (!title.trim()) return;

    startTransition(async () => {
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        date,
        category,
        note: note.trim() || undefined,
        files: files.map((f, i) => ({
          fileUrl: f.fileUrl,
          fileKey: f.fileKey,
          fileName: f.fileName,
          fileType: f.fileType,
          fileSize: f.fileSize,
          order: i,
        })),
      });

      await utils.healthDocuments.invalidate();
      router.push(`/hub/documents/${result.id}`);
    });
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/hub/documents"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-light tracking-wide">
          {t("documents:newDocument")}
        </h1>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-500">
            {t("documents:documentTitle")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("documents:documentTitlePlaceholder")}
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/30"
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-500">
            {t("documents:documentDate")}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/30"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-500">
            {t("documents:category")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof HEALTH_DOCUMENT_CATEGORIES)[number])}
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/30"
          >
            {HEALTH_DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`documents:categories.${cat}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-500">
            {t("documents:note")}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("documents:notePlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/30 resize-none"
          />
        </div>

        {/* File Upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-500">
            {t("documents:attachments")}
          </label>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() =>
              document.getElementById("file-input")?.click()
            }
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors",
              "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500",
              uploading && "pointer-events-none opacity-50",
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                <span className="text-sm text-neutral-500">
                  {t("documents:uploading")}
                </span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-neutral-400" />
                <span className="text-sm text-neutral-500">
                  {t("documents:dragOrClick")}
                </span>
                <span className="text-xs text-neutral-400">
                  {t("documents:maxFileSize")}
                </span>
              </>
            )}
          </div>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />

          {/* File Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {files.map((f, i) => (
                <div
                  key={f.fileKey}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-black/[0.06] dark:border-white/[0.06]"
                >
                  {f.preview ? (
                    <img
                      src={f.preview}
                      alt={f.fileName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-neutral-50 dark:bg-neutral-900">
                      <FileText className="h-6 w-6 text-neutral-400" />
                      <span className="text-[10px] text-neutral-400 truncate max-w-[80%] px-1">
                        {f.fileName}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!title.trim() || isPending}
        className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
        ) : (
          t("documents:save")
        )}
      </button>
    </div>
  );
}
