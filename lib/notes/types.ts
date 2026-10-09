import type { JSONContent } from "@tiptap/react";

export type Note = {
  id: string;
  title: string;
  content: string;
  document: JSONContent | null;
  coverAttachmentId: string | null;
  coverPosition: number;
  createdAt: string;
  updatedAt: string;
};
export type NoteAttachment = {
  id: string;
  noteId: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: string;
};
export type StoredAttachment = NoteAttachment & { blob: Blob };
export const attachmentLimit = 20 * 1024 * 1024;
export const attachmentOrigin = "https://notes.viniszofx.invalid";
export const attachmentUrl = (id: string) => `${attachmentOrigin}/attachments/${id}`;
export function attachmentId(url: string | undefined) {
  try {
    const parsed = new URL(url ?? "");
    return parsed.origin === attachmentOrigin ? parsed.pathname.match(/^\/attachments\/([\w-]+)$/)?.[1] : undefined;
  } catch { return undefined; }
}
export function createId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
