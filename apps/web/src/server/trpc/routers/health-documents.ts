import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  healthDocuments,
  healthDocumentFiles,
} from "@/server/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { deleteFile } from "@/server/services/r2";
import { HEALTH_DOCUMENT_CATEGORIES } from "@open-health/shared/constants";

const fileInput = z.object({
  fileUrl: z.string(),
  fileKey: z.string(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  order: z.number().int().default(0),
});

const createInput = z.object({
  title: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(HEALTH_DOCUMENT_CATEGORIES),
  note: z.string().max(5000).optional(),
  files: z.array(fileInput).default([]),
});

const updateInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.enum(HEALTH_DOCUMENT_CATEGORIES).optional(),
  note: z.string().max(5000).nullable().optional(),
  addFiles: z.array(fileInput).default([]),
  removeFileIds: z.array(z.string().uuid()).default([]),
});

export const healthDocumentsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          category: z.enum(HEALTH_DOCUMENT_CATEGORIES).optional(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(healthDocuments.userId, ctx.user.id)];
      if (input.category) {
        conditions.push(eq(healthDocuments.category, input.category));
      }

      const docs = await ctx.db
        .select({
          id: healthDocuments.id,
          title: healthDocuments.title,
          date: healthDocuments.date,
          category: healthDocuments.category,
          note: healthDocuments.note,
          createdAt: healthDocuments.createdAt,
          updatedAt: healthDocuments.updatedAt,
          fileCount: sql<number>`(
            SELECT COUNT(*)::int FROM health_document_files
            WHERE health_document_files.document_id = ${healthDocuments.id}
          )`,
        })
        .from(healthDocuments)
        .where(and(...conditions))
        .orderBy(desc(healthDocuments.date));

      return docs;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [doc] = await ctx.db
        .select()
        .from(healthDocuments)
        .where(
          and(
            eq(healthDocuments.id, input.id),
            eq(healthDocuments.userId, ctx.user.id),
          ),
        );

      if (!doc) return null;

      const files = await ctx.db
        .select()
        .from(healthDocumentFiles)
        .where(eq(healthDocumentFiles.documentId, doc.id))
        .orderBy(healthDocumentFiles.order);

      return { ...doc, files };
    }),

  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const [doc] = await ctx.db
        .insert(healthDocuments)
        .values({
          userId: ctx.user.id,
          title: input.title,
          date: input.date,
          category: input.category,
          note: input.note || null,
        })
        .returning({ id: healthDocuments.id });

      if (input.files.length > 0) {
        await ctx.db.insert(healthDocumentFiles).values(
          input.files.map((f, i) => ({
            documentId: doc.id,
            fileUrl: f.fileUrl,
            fileKey: f.fileKey,
            fileName: f.fileName,
            fileType: f.fileType,
            fileSize: f.fileSize,
            order: f.order ?? i,
          })),
        );
      }

      return { id: doc.id };
    }),

  update: protectedProcedure
    .input(updateInput)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await ctx.db
        .select({ id: healthDocuments.id })
        .from(healthDocuments)
        .where(
          and(
            eq(healthDocuments.id, input.id),
            eq(healthDocuments.userId, ctx.user.id),
          ),
        );

      if (!existing) throw new Error("Document not found");

      // Update metadata
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.title !== undefined) updates.title = input.title;
      if (input.date !== undefined) updates.date = input.date;
      if (input.category !== undefined) updates.category = input.category;
      if (input.note !== undefined) updates.note = input.note;

      await ctx.db
        .update(healthDocuments)
        .set(updates)
        .where(eq(healthDocuments.id, input.id));

      // Remove files
      if (input.removeFileIds.length > 0) {
        const filesToRemove = await ctx.db
          .select({ id: healthDocumentFiles.id, fileKey: healthDocumentFiles.fileKey })
          .from(healthDocumentFiles)
          .where(
            and(
              eq(healthDocumentFiles.documentId, input.id),
              sql`${healthDocumentFiles.id} IN (${sql.join(
                input.removeFileIds.map((id) => sql`${id}::uuid`),
                sql`, `,
              )})`,
            ),
          );

        for (const f of filesToRemove) {
          await deleteFile(f.fileKey).catch((err) => console.error("Failed to delete R2 file:", f.fileKey, err));
        }

        await ctx.db
          .delete(healthDocumentFiles)
          .where(
            and(
              eq(healthDocumentFiles.documentId, input.id),
              sql`${healthDocumentFiles.id} IN (${sql.join(
                input.removeFileIds.map((id) => sql`${id}::uuid`),
                sql`, `,
              )})`,
            ),
          );
      }

      // Add new files
      if (input.addFiles.length > 0) {
        const maxOrder = await ctx.db
          .select({ max: sql<number>`COALESCE(MAX(${healthDocumentFiles.order}), -1)` })
          .from(healthDocumentFiles)
          .where(eq(healthDocumentFiles.documentId, input.id))
          .then((r) => r[0]?.max ?? -1);

        await ctx.db.insert(healthDocumentFiles).values(
          input.addFiles.map((f, i) => ({
            documentId: input.id,
            fileUrl: f.fileUrl,
            fileKey: f.fileKey,
            fileName: f.fileName,
            fileType: f.fileType,
            fileSize: f.fileSize,
            order: maxOrder + 1 + i,
          })),
        );
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await ctx.db
        .select({ id: healthDocuments.id })
        .from(healthDocuments)
        .where(
          and(
            eq(healthDocuments.id, input.id),
            eq(healthDocuments.userId, ctx.user.id),
          ),
        );

      if (!existing) throw new Error("Document not found");

      // Delete R2 files first
      const files = await ctx.db
        .select({ fileKey: healthDocumentFiles.fileKey })
        .from(healthDocumentFiles)
        .where(eq(healthDocumentFiles.documentId, input.id));

      for (const f of files) {
        await deleteFile(f.fileKey).catch((err) => console.error("Failed to delete R2 file:", f.fileKey, err));
      }

      // Cascade delete handles files table
      await ctx.db
        .delete(healthDocuments)
        .where(eq(healthDocuments.id, input.id));

      return { success: true };
    }),
});
