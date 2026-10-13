"use client";

import { useRef, useState } from "react";
import { attachmentUrl, type NoteAttachment } from "@/lib/notes/types";
import type { BlogAssetData } from "@/lib/blog/types";

const maxSize = 20 * 1024 * 1024;
const toAttachment = (asset: BlogAssetData, postId: string): NoteAttachment => ({
  id: asset.id, noteId: postId, name: asset.name, size: asset.size,
  contentType: asset.contentType, createdAt: asset.createdAt,
});

export function useBlogAssets({ postId, initial, onEmbed, onUploaded, onRemoved, beforeRemove }: {
  postId: string;
  initial: BlogAssetData[];
  onEmbed: (markdown: string) => void;
  onUploaded?: (file: NoteAttachment) => void;
  onRemoved?: (file: NoteAttachment) => void;
  beforeRemove?: () => Promise<void>;
}) {
  const [attachments, setAttachments] = useState<NoteAttachment[]>(() => initial.map((item) => toAttachment(item, postId)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);

  async function upload(files: File[], embed = true) {
    if (lock.current || !files.length) return;
    if (files.some((file) => !file.size || file.size > maxSize)) { setError("Selecione arquivos de até 20 MB cada."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      for (const file of files) {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch(`/api/blog/posts/${postId}/assets`, { method: "POST", body: form });
        if (!response.ok) throw new Error(await response.text() || "Falha no upload.");
        const saved = toAttachment(await response.json() as BlogAssetData, postId);
        setAttachments((previous) => [...previous, saved]);
        onUploaded?.(saved);
        if (embed) {
          const label = saved.name.replace(/[\r\n]/g, " ").replace(/([\\[\]])/g, "\\$1");
          onEmbed(`${saved.contentType.startsWith("image/") ? "!" : ""}[${label}](${attachmentUrl(saved.id)})`);
        }
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar o arquivo."); }
    finally { lock.current = false; setBusy(false); }
  }

  async function remove(file: NoteAttachment) {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError("");
    try {
      await beforeRemove?.();
      const response = await fetch(`/api/blog/posts/${postId}/assets/${file.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text() || "Não foi possível excluir o arquivo.");
      setAttachments((previous) => previous.filter((item) => item.id !== file.id));
      onRemoved?.(file);
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível excluir o arquivo."); return false; }
    finally { lock.current = false; setBusy(false); }
  }

  return { attachments, loading: false, busy, error, upload, remove,
    url: (file: NoteAttachment, preview = false) => { void preview; return attachmentUrl(file.id); } };
}
