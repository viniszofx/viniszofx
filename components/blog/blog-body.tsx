"use client";

import dynamic from "next/dynamic";
import { AttachmentProvider } from "@/components/editor/attachment-provider";
import type { StoredAttachment } from "@/lib/notes/types";
import { blogAssetUrl } from "@/lib/blog/types";

const RichTextEditor = dynamic(() => import("@/components/notes/editor/rich-text-editor").then((module) => module.RichTextEditor), {
  ssr: false,
  loading: () => <p className="text-sm text-muted-foreground">Carregando publicação…</p>,
});

export async function resolveBlogAsset(id: string): Promise<StoredAttachment | undefined> {
  const response = await fetch(blogAssetUrl(id), { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível carregar o arquivo da publicação.");
  const blob = await response.blob();
  return { id, noteId: "", name: id, blob, size: blob.size, contentType: blob.type,
    createdAt: new Date().toISOString() };
}

export function BlogBody({ content, document }: { content: string; document: Record<string, unknown> | null }) {
  return <AttachmentProvider resolve={resolveBlogAsset}>
    <div className="min-w-0 text-foreground [&_.tiptap]:text-base [&_.tiptap]:leading-8">
      <RichTextEditor value={content} document={document} extendedMarkdown documentMode
        ariaLabel="Conteúdo da publicação" showActions={false} />
    </div>
  </AttachmentProvider>;
}
