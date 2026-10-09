"use client";
import dynamic from "next/dynamic";
import { useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { AttachmentProvider } from "@/components/editor/attachment-provider";
import type { CardAttachment } from "@/lib/boards/store";
const RichTextEditor = dynamic(() => import("@/components/notes/editor/rich-text-editor").then(module => module.RichTextEditor), { ssr: false, loading: () => <div role="status" className="h-40 animate-pulse bg-muted">Carregando editor…</div> });
export function CardDescriptionEditor({ value, document, attachments, onChange, onDocumentChange, onReady, onInsertFile }: { value: string; document?: Record<string, unknown> | null; attachments: CardAttachment[]; onChange: (value: string) => void; onDocumentChange: (value: Record<string, unknown>) => void; onReady: (editor: Editor | null) => void; onInsertFile: (kind: "image" | "file") => void }) {
  const resolve = useCallback(async (id: string) => {
    const file = attachments.find(file => file.id === id);
    return file ? { ...file, noteId: "card", contentType: file.type, createdAt: "", blob: file.blob } : undefined;
  }, [attachments]);
  return <AttachmentProvider resolve={resolve}><section aria-label="Descrição do card" className="min-w-0 border bg-background px-10 [&_.tiptap]:min-h-52! [&_.tiptap]:text-sm! [&_.tiptap]:py-4!">
    <RichTextEditor value={value} document={document} editable extendedMarkdown documentMode showActions={false} ariaLabel="Descrição" onChange={onChange} onDocumentChange={onDocumentChange} onReady={onReady} onInsertFile={onInsertFile} />
  </section></AttachmentProvider>;
}
