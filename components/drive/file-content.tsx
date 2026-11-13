"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LoadingBlock } from "@/components/ui/feedback";
import { previewKind } from "@/lib/drive/files";
import { useObjectUrl } from "@/lib/browser/use-object-url";

export type SaveHandler = (edited: Blob, automatic: boolean) => Promise<void>;

// Editors are heavy and browser-only: loaded on demand, never during SSR.
const DocxDocument = dynamic(() => import("./editors/docx-document").then(module => module.DocxDocument), { ssr: false, loading: () => <LoadingBlock label="Abrindo editor de documentos" /> });
const XlsxDocument = dynamic(() => import("./editors/xlsx-document").then(module => module.XlsxDocument), { ssr: false, loading: () => <LoadingBlock label="Abrindo editor de planilhas" /> });
const PdfDocument = dynamic(() => import("./pdf/components/pdf-document").then(module => module.PdfDocument), { ssr: false, loading: () => <LoadingBlock label="Abrindo PDF" /> });

function TextPreview({ blob }: { blob: Blob }) {
  const [text, setText] = useState<string>();
  useEffect(() => {
    let active = true;
    // Large logs stay readable without freezing the tab.
    void blob.slice(0, 2 * 1024 * 1024).text().then(value => { if (active) setText(value); });
    return () => { active = false; };
  }, [blob]);
  if (text === undefined) return <LoadingBlock label="Abrindo arquivo" />;
  return <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words border bg-card p-4 font-mono text-xs">{text}{blob.size > 2 * 1024 * 1024 && "\n\n… (prévia limitada aos primeiros 2 MB)"}</pre>;
}

function MediaPreview({ name, blob, kind }: { name: string; blob: Blob; kind: "image" | "video" | "audio" }) {
  const url = useObjectUrl(blob);
  if (!url) return <LoadingBlock label="Abrindo arquivo" />;
  // SVG only renders through <img>, where scripts don't run.
  if (kind === "image") return <img src={url} alt={name} className="mx-auto min-h-0 max-w-full flex-1 object-contain" />;
  if (kind === "video") return <video controls src={url} className="mx-auto min-h-0 max-w-full flex-1" />;
  return <audio controls src={url} className="w-full" />;
}

/** Opens a Drive file: editors for DOCX, XLSX and PDF (read-only without `onSave`), previews for the rest. */
export function FileContent({ name, blob, onSave, leading }: { name: string; blob: Blob; onSave?: SaveHandler; leading?: React.ReactNode }) {
  const kind = previewKind(name);
  const lower = name.toLowerCase();
  if (kind === "docx" && lower.endsWith(".docx")) return <DocxDocument file={blob} name={name} onSave={onSave} allowAutoSave leading={leading} />;
  if (kind === "sheet" && lower.endsWith(".xlsx")) return <XlsxDocument file={blob} name={name} onSave={onSave} leading={leading} />;
  if (kind === "pdf") return <PdfDocument file={blob} name={name} onSave={onSave && (edited => onSave(edited, false))} leading={leading} />;
  if (kind === "text") return <TextPreview blob={blob} />;
  if (kind === "image" || kind === "video" || kind === "audio") return <MediaPreview name={name} blob={blob} kind={kind} />;
  return <p className="grid flex-1 place-items-center text-center text-sm text-muted-foreground">{kind === "docx" || kind === "sheet" ? "Formato antigo do Office (.doc/.xls): baixe o arquivo para abrir, ou salve-o como .docx/.xlsx." : "Este formato não tem prévia. Baixe o arquivo para abrir."}</p>;
}
