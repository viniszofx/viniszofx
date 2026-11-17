"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RiArrowLeftLine, RiDownloadLine, RiLink } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { FileContent, type SaveHandler } from "./file-content";
import { ShareDialog } from "./share-dialog";
import { driveStore } from "@/lib/nodus/stores";
import { readDriveFile, replaceDriveFile, touchDriveItem } from "@/lib/drive/client";
import { formatBytes, previewKind, saveBlob } from "@/lib/drive/files";
import { notifySuccess } from "@/lib/ui/notifications";

const EDITABLE = new Set(["docx", "sheet", "pdf"]);

export function DriveFilePage({ itemId }: { itemId: string }) {
  const { records, loaded } = driveStore.useRecords();
  const item = records.find(entry => entry.id === itemId && entry.kind === "file");
  const [blob, setBlob] = useState<Blob>();
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const opened = useRef(false);
  // Objects written by this page: the editor already shows them, so they are not reloaded.
  const ownObjects = useRef(new Set<string>());
  const fileKey = item?.file?.blob.__viniszofxFile;

  useEffect(() => {
    if (!item || !fileKey || ownObjects.current.has(fileKey)) return;
    let active = true;
    if (!opened.current) { opened.current = true; touchDriveItem(item); }
    readDriveFile(item).then(value => { if (active) setBlob(value); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível abrir o arquivo."); });
    return () => { active = false; };
    // Re-download only when the stored object changes, not on every record update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey]);

  const save: SaveHandler = async (edited, automatic) => {
    ownObjects.current.add(await replaceDriveFile(itemId, edited));
    if (!automatic) notifySuccess("Arquivo salvo");
  };

  const editable = !!item && EDITABLE.has(previewKind(item.name));
  const back = item?.parentId ? `/dashboard/drive?folder=${item.parentId}` : "/dashboard/drive";
  // DOCX, planilha e PDF têm barra própria (Nodus): Voltar, nome e Compartilhar entram nela; sem cabeçalho extra.
  const ownBar = editable && !!blob;
  const leading = item && <>
    <Link href={back} title="Voltar" className={buttonVariants({ variant: "ghost", size: "sm" })}><RiArrowLeftLine /><span className="max-xl:sr-only">Voltar</span></Link>
    <h1 className="min-w-0 truncate text-sm font-semibold" title={item.name}>{item.name}</h1>
    {item.file && <span className="hidden shrink-0 text-xs text-muted-foreground xl:inline">{formatBytes(item.file.size)}</span>}
    <Button type="button" variant="ghost" size="sm" title={item.shareToken ? "Link ativo" : "Compartilhar"} onClick={() => setSharing(true)}><RiLink /><span className="max-xl:sr-only">{item.shareToken ? "Link ativo" : "Compartilhar"}</span></Button>
  </>;
  return <section aria-label={item?.name ?? "Arquivo"} className="flex h-[calc(100dvh-57px-3.5rem-env(safe-area-inset-bottom))] min-w-0 flex-col bg-background md:h-[calc(100dvh-57px)]">
    {!ownBar && <header className="flex min-h-12 flex-wrap items-center gap-2 border-b px-3 py-1.5">
      <Link href={back} className={buttonVariants({ variant: "ghost", size: "sm" })}><RiArrowLeftLine />Voltar</Link>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold" title={item?.name}>{item?.name}</h1>
      {item?.file && <span className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</span>}
      {item && <Button type="button" variant="ghost" size="sm" onClick={() => setSharing(true)}><RiLink />{item.shareToken ? "Link ativo" : "Compartilhar"}</Button>}
      {blob && item && !editable && <Button type="button" variant="ghost" size="sm" onClick={() => saveBlob(blob, item.name)}><RiDownloadLine />Baixar</Button>}
    </header>}
    <div className={`flex min-h-0 flex-1 flex-col ${ownBar ? "" : "p-2"}`}>
      {loaded && !item ? <EmptyState className="flex-1">Arquivo não encontrado.</EmptyState>
        : error ? <EmptyState className="flex-1 text-destructive">{error}</EmptyState>
        : blob && item ? <FileContent name={item.name} blob={blob} onSave={save} leading={ownBar ? leading : undefined} />
        : <LoadingBlock label="Abrindo arquivo" />}
    </div>
    {sharing && item && <ShareDialog item={item} onClose={() => setSharing(false)} />}
  </section>;
}
