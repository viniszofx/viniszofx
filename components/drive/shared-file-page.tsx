"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { RiArrowLeftLine, RiDownloadLine, RiFolderLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { FileContent } from "./file-content";
import { ItemIcon } from "./item-icon";
import { extension, formatBytes, MEDIA, saveBlob } from "@/lib/drive/files";

type Entry = { id: string; kind: "file" | "folder"; name: string; size: number };
type Info = Entry & { items?: Entry[] };

export function SharedFilePage({ token }: { token: string }) {
  const [info, setInfo] = useState<Info>();
  const [stack, setStack] = useState<Entry[]>([]);
  const [file, setFile] = useState<{ name: string; size: number; blob: Blob }>();
  const [error, setError] = useState("");
  const currentId = stack.at(-1)?.id;
  useEffect(() => {
    let active = true;
    const base = `/api/shared/drive/${encodeURIComponent(token)}`;
    const query = currentId ? `&item=${encodeURIComponent(currentId)}` : "";
    // Limpa a pasta/arquivo anterior fora do corpo do efeito.
    queueMicrotask(() => { if (active) { setInfo(undefined); setFile(undefined); setError(""); } });
    void fetch(`${base}?info${query}`).then(async response => {
      if (!response.ok) throw new Error("Link inválido ou removido.");
      const next = await response.json() as Info;
      if (!active) return;
      setInfo(next);
      if (next.kind !== "file") return;
      const content = await fetch(`${base}${currentId ? `?item=${encodeURIComponent(currentId)}` : ""}`);
      if (!content.ok) throw new Error("Não foi possível abrir o arquivo.");
      const blob = new Blob([await content.blob()], { type: MEDIA[extension(next.name)] ?? "application/octet-stream" });
      if (active) setFile({ name: next.name, size: next.size, blob });
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível abrir o link."); });
    return () => { active = false; };
  }, [token, currentId]);

  return <main className="flex h-dvh min-w-0 flex-col bg-background">
    <header className="flex min-h-14 flex-wrap items-center gap-3 border-b px-4 py-2">
      {stack.length > 0 && <Button variant="ghost" size="icon-sm" aria-label="Voltar" onClick={() => setStack(value => value.slice(0, -1))}><RiArrowLeftLine /></Button>}
      {info && <ItemIcon item={{ kind: info.kind, name: info.name }} className="size-6 shrink-0" />}
      <h1 className="min-w-0 flex-1 truncate font-semibold">{info?.name ?? "Arquivo compartilhado"}</h1>
      {file && <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>}
      {file && <Button type="button" onClick={() => saveBlob(file.blob, file.name)}><RiDownloadLine />Baixar</Button>}
    </header>
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      {error ? <p role="alert" className="grid flex-1 place-items-center text-sm text-muted-foreground">{error}</p>
        : info?.kind === "folder" ? <ul className={cn(surfaceVariants({ list: true }), "mx-auto w-full max-w-3xl")}>{info.items?.map(item => <li key={item.id}><button type="button" onClick={() => setStack(value => [...value, item])} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted">{item.kind === "folder" ? <RiFolderLine className="size-5" /> : <ItemIcon item={item} className="size-5" />}<span className="flex-1 truncate">{item.name}</span><span className="text-xs text-muted-foreground">{item.kind === "folder" ? "Pasta" : formatBytes(item.size)}</span></button></li>)}</ul>
        : file ? <FileContent name={file.name} blob={file.blob} />
        : <div role="status" aria-label="Abrindo arquivo" className="h-40 animate-pulse bg-muted" />}
    </div>
  </main>;
}
