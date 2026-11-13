"use client";
// Adaptações do editor de PDF do Nodus a este app (avisos, download e sessão).
import { notifyError, notifySuccess } from "@/lib/ui/notifications";
import { saveBlob as save } from "@/lib/drive/files";
export type { CommentAction as PdfCommentAction } from "./annotations/mod";

export const toast = {
  error: (title: string, description?: string) => notifyError(title, description ?? ""),
  success: (title: string, description?: string) => notifySuccess(title, description),
};
export const saveBlob = (blob: Blob, name: string) => save(blob, name);
