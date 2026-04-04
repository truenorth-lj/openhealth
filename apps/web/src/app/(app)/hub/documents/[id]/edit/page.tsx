"use client";

import { Suspense, useState, useCallback, useTransition, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  preview?: string;
}

interface ExistingFile {
  id: string;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

function EditDocumentContent() {
  const { t } = useTranslation(["documents", "common"]);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<(typeof HEALTH_DOCUMENT_CATEGORIES)[number]>("checkup");
  const [note, setNote] = useState("");
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [removedFileIds, setRemovedFileIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const utils = trpc.useUtils();
  const { data: doc } = trpc.healthDocuments.getById.useQuery({ id });
  const updateMutation = trpc.healthDocuments.update.useMutation();

  // Populate form from fetched doc
  useEffect(() => {
    if (doc && !loaded) {
      setTitle(doc.title);
      setDate(doc.date);
      setCategory(doc.category as (typeof HEALTH_DOCUMENT_CATEGORIES)[number]);
      setNote(doc.note || "");
      setExistingFiles(doc.files);
      setLoaded(true);
    }
  }, [doc, loaded]);

  const handleFileUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setUploading(true);
      try {
        const uploaded: UploadedFile[] = [];
        for (const file of Array.from(fileList)) {
          if (file.size > 10 * 1024 * 1024) {
            alert(`${file.name} exceeds 10MB limit`);
            continue;
          }
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", "documents");
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) {
            const err = await res.json();
            alert(err.error || "Upload failed");
            continue;
          }
          const data = await res.json();
          const preview = file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined;
          uploaded.push({ ...data, preview });
        }
        setNewFiles((prev) => [...prev, ...uploaded]);
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const removeExistingFile = (fileId: string) => {
    setRemovedFileIds((prev) => [...prev, fileId]);
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

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
      await updateMutation.mutateAsync({
        id,
        title: title.trim(),
        date,
        category,
        note: note.trim() || null,
        removeFileIds: removedFileIds,
        addFiles: newFiles.map((f, i) => ({
          fileUrl: f.fileUrl,
          fileKey: f.fileKey,
          fileName: f.fileName,
          fileType: f.fileType,
          fileSize: f.fileSize,
          order: i,
        })),
      });
      await utils.healthDocuments.invalidate();
      router.push(`/hub/documents/${id}`);
    });
  };

  if (!doc) {
    return (
      <div className="px-4 py-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/hub/documents/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-light tracking-wide">
          {t("documents:editDocument")}
        </h1>
      </div>

      {/* Form */}
      <div className="space-y-5">
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

        {/* Files */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-500">
            {t("documents:attachments")}
          </label>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("edit-file-input")?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-colors",
              "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500",
              uploading && "pointer-events-none opacity-50",
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                <span className="text-sm text-neutral-500">{t("documents:uploading")}</span>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-neutral-400" />
                <span className="text-sm text-neutral-500">{t("documents:dragOrClick")}</span>
              </>
            )}
          </div>
          <input
            id="edit-file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />

          {/* Existing + New Files */}
          {(existingFiles.length > 0 || newFiles.length > 0) && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {existingFiles.map((f) => (
                <div
                  key={f.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-black/[0.06] dark:border-white/[0.06]"
                >
                  {f.fileType.startsWith("image/") ? (
                    <img src={f.fileUrl} alt={f.fileName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-neutral-50 dark:bg-neutral-900">
                      <FileText className="h-6 w-6 text-neutral-400" />
                      <span className="text-[10px] text-neutral-400 truncate max-w-[80%] px-1">
                        {f.fileName}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeExistingFile(f.id)}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {newFiles.map((f, i) => (
                <div
                  key={f.fileKey}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-primary/30"
                >
                  {f.preview ? (
                    <img src={f.preview} alt={f.fileName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-neutral-50 dark:bg-neutral-900">
                      <FileText className="h-6 w-6 text-neutral-400" />
                      <span className="text-[10px] text-neutral-400 truncate max-w-[80%] px-1">
                        {f.fileName}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeNewFile(i)}
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

export default function EditDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
      }
    >
      <EditDocumentContent />
    </Suspense>
  );
}
