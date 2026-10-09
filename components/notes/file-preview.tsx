"use client";

import { useEffect, useState } from "react";
import type { NoteAttachment } from "@/lib/notes/types";
import { LocalImage } from "./local-image";
import { useAttachment } from "./use-attachment";
import { NotesSkeleton } from "./notes-skeleton";

export function FilePreview({ file, url }: { file: NoteAttachment; url: string }) {
  const resolved = useAttachment(url);
  if (resolved.error) return <p role="alert" className="text-sm text-destructive">{resolved.error}</p>;
  if (!resolved.url) return <NotesSkeleton label="Carregando arquivo…" />;
  if (file.contentType.startsWith("image/")) return <LocalImage src={resolved.url} alt={file.name} className="max-h-[65dvh] w-full object-contain" />;
  if (file.contentType === "application/pdf") return <iframe title={file.name} sandbox="allow-same-origin" src={resolved.url} className="h-[65dvh] w-full border border-border" />;
  if (file.contentType.startsWith("video/")) return <video controls src={resolved.url} className="max-h-[65dvh] w-full" />;
  if (file.contentType.startsWith("audio/")) return <audio controls src={resolved.url} className="w-full" />;
  if (/^(text\/|application\/json)/.test(file.contentType)) return <TextPreview url={resolved.url} />;
  return <p className="text-sm text-muted-foreground">Baixe este arquivo para abri-lo no seu dispositivo.</p>;
}
function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState<string>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then((response) => response.text()).then((value) => {
      if (!controller.signal.aborted) setText(value.length > 200_000 ? `${value.slice(0, 200_000)}\n… Prévia limitada.` : value);
    }).catch((cause) => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [url]);
  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (text === undefined) return <NotesSkeleton label="Carregando prévia…" />;
  return <pre className="max-h-[65dvh] overflow-auto whitespace-pre-wrap break-words bg-muted p-4 text-xs">{text}</pre>;
}
