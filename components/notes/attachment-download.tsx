"use client";

import { useState, type ComponentProps } from "react";
import { useAttachmentResolver } from "@/components/editor/attachment-provider";
import { attachmentId } from "@/lib/notes/types";

export function AttachmentDownload({ href, name, children, ...props }: ComponentProps<"a"> & { href: string; name: string }) {
  const resolve = useAttachmentResolver();
  const [error, setError] = useState("");
  return <><a {...props} href={href} onClick={async (event) => {
    const id = attachmentId(href);
    if (!id) return;
    event.preventDefault();
    try {
      const file = await resolve(id);
      if (!file) throw new Error("Arquivo não encontrado.");
      const url = URL.createObjectURL(file.blob), link = document.createElement("a");
      link.href = url; link.download = name; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao baixar o arquivo."); }
  }}>{children}</a>{error && <span role="alert" className="text-xs text-destructive">{error}</span>}</>;
}
