"use client";
// Copiado do Nodus e ligado ao Drive daqui.
import { useRef, useState } from "react";
import { RiArrowLeftSLine, RiLoader4Line, RiSearchLine, RiUpload2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ItemIcon } from "@/components/drive/item-icon";
import { driveStore, type DriveItem } from "@/lib/nodus/stores";
import { fetchStoredFile } from "@/lib/storage/collections";

type View = "recent" | "drive" | "shared" | "public";
const views: { view: View; label: string }[] = [
  { view: "recent", label: "Recentes" },
  { view: "drive", label: "Meu Drive" },
  { view: "shared", label: "Compartilhados" },
  { view: "public", label: "Público" },
];
const MAX = 20 * 1024 * 1024;
const size = (bytes: number | null) => bytes === null ? "" : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;

// "Finder" do Drive para anexar na conversa: abas como no Drive, pastas navegáveis e filtro por nome.
// Escolher um arquivo baixa do Drive e envia pela mesma rota de anexo; "Do aparelho" abre o seletor do sistema.
export function DriveFilePicker({ open, onOpenChange, onPick }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (file: File) => Promise<void> | void;
}) {
  const [view, setView] = useState<View>("recent");
  const [parentId, setParentId] = useState("");
  const [filter, setFilter] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const deviceInput = useRef<HTMLInputElement>(null);
  const drive = driveStore.useRecords(open);
  const all = drive.records;
  const term = filter.trim().toLocaleLowerCase("pt-BR");
  const base = view === "recent" ? all.filter(item => item.kind === "file").sort((a, b) => (b.openedAt ?? b.updatedAt).localeCompare(a.openedAt ?? a.updatedAt)).slice(0, 50)
    : view === "shared" ? all.filter(item => item.visibility === "organization")
    : view === "public" ? all.filter(item => item.visibility === "public" || item.shareToken)
    : all.filter(item => item.parentId === parentId);
  const items = base
    .filter(item => !term || item.name.toLocaleLowerCase("pt-BR").includes(term))
    .sort((a, b) => view === "recent" ? 0 : Number(b.kind === "folder") - Number(a.kind === "folder") || a.name.localeCompare(b.name, "pt-BR"));
  const path: DriveItem[] = [];
  for (let current = all.find(item => item.id === parentId); view === "drive" && current; current = all.find(item => item.id === current!.parentId)) path.unshift(current);

  function change(next: boolean) {
    onOpenChange(next);
    if (!next) { setView("recent"); setParentId(""); setFilter(""); setError(""); setLoadingId(null); }
  }
  function openFolder(item: DriveItem) {
    setView("drive");
    setParentId(item.id);
    setFilter("");
  }
  async function choose(item: DriveItem) {
    if (loadingId || !item.file) return;
    setLoadingId(item.id);
    setError("");
    try {
      const blob = await fetchStoredFile(item.file.blob);
      await onPick(new File([blob], item.name, { type: item.file.type || blob.type || "application/octet-stream" }));
      change(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível anexar o arquivo.");
    } finally {
      setLoadingId(null);
    }
  }

  return <Dialog open={open} onOpenChange={change}>
    <DialogContent className="flex h-[min(40rem,85dvh)] flex-col gap-3 overflow-hidden sm:max-w-2xl max-md:top-auto max-md:bottom-0 max-md:w-full max-md:max-w-full max-md:translate-y-0 max-md:rounded-b-none max-md:pb-[max(1rem,env(safe-area-inset-bottom))] max-md:data-open:zoom-in-100 max-md:data-open:slide-in-from-bottom max-md:data-closed:zoom-out-100 max-md:data-closed:slide-out-to-bottom">
      <span aria-hidden="true" className="mx-auto -mt-2 h-1 w-10 rounded-full bg-muted-foreground/30 md:hidden" />
      <DialogTitle>Anexar arquivo</DialogTitle>
      <div role="tablist" aria-label="Seções do Drive" className="grid grid-cols-4 gap-1 rounded-full border bg-muted/60 p-1">
        {views.map(item => <button key={item.view} type="button" role="tab" aria-selected={view === item.view}
          onClick={() => { setView(item.view); setParentId(""); setFilter(""); }}
          className={`h-8 truncate rounded-full px-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:text-sm ${view === item.view ? "glass-float border text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {item.label}
        </button>)}
      </div>
      <div className="flex items-center gap-2">
        {view === "drive" && parentId && <Button type="button" variant="ghost" size="icon-sm" aria-label="Voltar à pasta anterior"
          onClick={() => setParentId(path.at(-2)?.id ?? "")}><RiArrowLeftSLine /></Button>}
        <nav aria-label="Caminho" className="min-w-0 flex-1 truncate text-sm">
          {view === "drive"
            ? <>
              <button type="button" className="font-medium hover:underline" onClick={() => setParentId("")}>Meu Drive</button>
              {path.map(folder => <span key={folder.id}> / <button type="button" className="hover:underline" onClick={() => setParentId(folder.id)}>{folder.name}</button></span>)}
            </>
            : <span className="font-medium">{views.find(item => item.view === view)?.label}</span>}
        </nav>
        <div className="relative w-40 shrink-0 sm:w-56">
          <RiSearchLine aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" aria-label="Filtrar por nome" placeholder="Filtrar..." value={filter} onChange={event => setFilter(event.target.value)} className="h-8 rounded-full pl-8" />
        </div>
      </div>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {!drive.loaded && <p className="py-10 text-center text-sm text-muted-foreground">Carregando arquivos…</p>}
        {drive.loaded && drive.error && !all.length && <p role="alert" className="py-10 text-center text-sm text-destructive">Não foi possível abrir o Drive.</p>}
        {drive.loaded && !drive.error && !items.length && <p className="py-10 text-center text-sm text-muted-foreground">{term ? "Nenhum arquivo com esse nome." : "Esta pasta está vazia."}</p>}
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
          {items.map(item => {
            const bytes = item.file?.size ?? null;
            const tooBig = item.kind === "file" && (bytes ?? 0) > MAX;
            return <button key={item.id} type="button" disabled={tooBig || (!!loadingId && loadingId !== item.id)}
              title={tooBig ? "Maior que 20 MB" : item.name}
              onClick={() => item.kind === "folder" ? openFolder(item) : void choose(item)}
              className="relative flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-3 text-center outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-45">
              <ItemIcon item={item} className="size-12" />
              <span className="line-clamp-2 w-full text-xs leading-tight font-medium break-all">{item.name}</span>
              {item.kind === "file" && <span className="text-[11px] text-muted-foreground">{tooBig ? "acima de 20 MB" : size(bytes)}</span>}
              {loadingId === item.id && <span className="absolute inset-0 grid place-items-center rounded-xl bg-background/60"><RiLoader4Line className="size-6 animate-spin text-primary" /></span>}
            </button>;
          })}
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-between gap-3 border-t pt-3">
        <p className="text-xs text-muted-foreground">Arquivos de até 20 MB.</p>
        <Button type="button" variant="outline" disabled={!!loadingId} onClick={() => deviceInput.current?.click()}><RiUpload2Line />Do aparelho</Button>
        <input ref={deviceInput} type="file" hidden onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) { change(false); void onPick(file); }
        }} />
      </div>
    </DialogContent>
  </Dialog>;
}
