"use client";

import { useEffect, useState } from "react";
import { useAttachmentResolver } from "@/components/editor/attachment-provider";
import { attachmentId, type NoteAttachment } from "@/lib/notes/types";

export function useAttachment(src: string | undefined) {
  const resolve = useAttachmentResolver();
  const id = attachmentId(src);
  const [resolved, setResolved] = useState<{ id: string; url: string; file: NoteAttachment }>();
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) return;
    let active = true, objectUrl: string | undefined;
    void resolve(id).then((file) => {
      if (!active) return;
      if (!file) throw new Error("Arquivo não encontrado neste navegador.");
      objectUrl = URL.createObjectURL(file.blob);
      setResolved({ id, url: objectUrl, file });
      setError("");
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível abrir o arquivo."); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, resolve]);
  return { url: id ? (resolved?.id === id ? resolved.url : undefined) : src,
    file: resolved && resolved.id === id ? resolved.file : undefined, error };
}
