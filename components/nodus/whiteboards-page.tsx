"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiAddLine as Plus, RiArrowLeftLine, RiDeleteBinLine as Trash2, RiDownloadLine, RiLoader4Line, RiPencilRuler2Line as Board, RiUploadLine as Upload } from "@remixicon/react";
import { CatalogCreate, CatalogFooter, CatalogLayout, CatalogPreview, CatalogSearch, CatalogTile, catalogGrid } from "@/components/listing/catalog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { LoadingBlock } from "@/components/ui/feedback";
import { NameDialog } from "@/components/ui/name-dialog";
import { whiteboardStore, type Whiteboard } from "@/lib/nodus/stores";
import { fieldsOf, matchesText } from "@/lib/records/store";
import { fetchStoredFile, uploadStoredFile } from "@/lib/storage/collections";
import { fileLimit } from "@/lib/storage/file-refs";
import { notifyError } from "@/lib/ui/notifications";
import type { WhiteboardHandle } from "./excalidraw-canvas";

const ExcalidrawCanvas = dynamic(() => import("./excalidraw-canvas"), { ssr: false, loading: () => <LoadingBlock label="Carregando o quadro" className="p-6" /> });

const fileName = (title: string) => title.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "quadro";
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const dataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });

/** Catálogo de quadros brancos (Nodus: Quadro branco, com o Excalidraw). */
export function WhiteboardsPage() {
  const router = useRouter();
  const { records, loaded } = whiteboardStore.useRecords();
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<Whiteboard | null>(null);
  const [deleting, setDeleting] = useState<Whiteboard | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const visible = records.filter(board => matchesText([board.title, board.code], search)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  async function create(title = "Novo quadro", content?: Blob) {
    try {
      const record = whiteboardStore.save({ title, content: content ? await uploadStoredFile(content) : null, thumbnail: "" });
      if (record) router.push(`/dashboard/whiteboards/${record.id}`);
    } catch (cause) { notifyError("Não foi possível criar o quadro", cause instanceof Error ? cause.message : ""); }
  }
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > fileLimit) return notifyError("Arquivo muito grande", "Quadros podem ter até 20 MB.");
    try { const parsed = JSON.parse(await file.text()); if (parsed?.type !== "excalidraw") throw new Error(); }
    catch { return notifyError("Arquivo inválido", "Escolha um arquivo .excalidraw."); }
    await create(file.name.replace(/\.(excalidraw|json)$/i, ""), new Blob([await file.text()], { type: "application/json" }));
  }
  return <CatalogLayout section="Ferramentas" title="Quadro branco" description="Rascunhos livres, brainstorms e esboços à mão, com o Excalidraw." action={<div className="flex gap-2"><Button variant="outline" disabled={!loaded} onClick={() => input.current?.click()}><Upload />Importar</Button><Button disabled={!loaded} onClick={() => void create()}><Plus />Novo quadro</Button></div>}>
    <input ref={input} type="file" accept=".excalidraw,application/json" className="hidden" aria-label="Importar quadro" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ""; }} />
    <CatalogSearch label="Buscar quadros" value={search} onChange={setSearch} />
    {!loaded ? <LoadingBlock label="Carregando quadros" /> : <div className={catalogGrid}>{visible.map(board => <CatalogTile key={board.id}>
      <Link href={`/dashboard/whiteboards/${board.id}`} className="text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Abrir ${board.title}`}>
        <CatalogPreview style={{ background: "white" }}>{board.thumbnail ? <img src={board.thumbnail} alt="" className="size-full object-contain p-2" /> : <Board className="size-8 text-primary" />}</CatalogPreview>
        <div className="p-4"><h2 className="truncate font-semibold">{board.title}</h2><p className="text-xs text-muted-foreground">Atualizado {new Date(board.updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p></div>
      </Link>
      <CatalogFooter><Button variant="ghost" size="xs" onClick={() => setRenaming(board)}>Renomear</Button><Button variant="ghost" size="icon-sm" aria-label={`Excluir ${board.title}`} onClick={() => setDeleting(board)}><Trash2 /></Button></CatalogFooter>
    </CatalogTile>)}{!search.trim() && <CatalogCreate label="Novo quadro" onClick={() => void create()} />}</div>}
    {renaming && <NameDialog title="Renomear quadro" initial={renaming.title} submitLabel="Renomear" onSubmit={title => { whiteboardStore.save({ ...fieldsOf(renaming), title }, renaming.id); }} onClose={() => setRenaming(null)} />}
    {deleting && <ConfirmDialog title="Excluir quadro?" description={`${deleting.title} será removido.`} onConfirm={() => whiteboardStore.remove(deleting.id)} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}

type Status = "loading" | "saved" | "pending" | "saving" | "error" | "large";

export function WhiteboardEditor({ id }: { id: string }) {
  const { records, loaded } = whiteboardStore.useRecords();
  const board = records.find(item => item.id === id);
  const [content, setContent] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [dark] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  const editor = useRef<WhiteboardHandle | null>(null);
  const current = useRef<string | null>(null);
  const saved = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(board);
  useEffect(() => { latest.current = board; }, [board]);
  const contentRef = board?.content?.__viniszofxFile;
  useEffect(() => {
    if (!loaded || content !== null) return;
    const reference = latest.current?.content;
    if (!reference) { setContent(""); return; }
    fetchStoredFile(reference).then(blob => blob.text()).then(setContent).catch(() => { setStatus("error"); notifyError("Não foi possível abrir o quadro", "Tente novamente."); });
  }, [loaded, content, contentRef]);

  const save = useCallback(async () => {
    window.clearTimeout(timer.current);
    const value = current.current; const record = latest.current;
    if (!record || value === null || value === saved.current) return;
    const blob = new Blob([value], { type: "application/json" });
    if (blob.size > fileLimit) { setStatus("large"); return; }
    setStatus("saving");
    try {
      const reference = await uploadStoredFile(blob);
      const image = await editor.current?.image("png", 0.3).catch(() => null);
      const thumbnail = image ? await dataUrl(image) : "";
      whiteboardStore.save({ ...fieldsOf(record), content: reference, thumbnail: thumbnail.length < 300_000 ? thumbnail : "" }, record.id, { silent: true });
      saved.current = value;
      setStatus(current.current === value ? "saved" : "pending");
    } catch (cause) { setStatus("error"); notifyError("Não foi possível salvar o quadro", cause instanceof Error ? cause.message : ""); }
  }, []);
  const changed = useCallback((value: string) => {
    current.current = value; setStatus("pending");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(), 1500);
  }, [save]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (current.current !== null && current.current !== saved.current) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => { window.removeEventListener("beforeunload", warn); void save(); };
  }, [save]);

  async function exportAs(format: "png" | "svg" | "excalidraw") {
    const name = fileName(board?.title ?? "");
    if (format === "excalidraw") { if (editor.current) download(new Blob([editor.current.content()], { type: "application/json" }), `${name}.excalidraw`); return; }
    const blob = await editor.current?.image(format, format === "png" ? 2 : 1).catch(() => null);
    if (!blob) return notifyError("Nada para exportar", "O quadro está vazio.");
    download(blob, `${name}.${format}`);
  }
  const label = { loading: "Abrindo…", saved: "Salvo", pending: "Alterações não salvas", saving: "Salvando…", error: "Erro ao salvar", large: "Grande demais para salvar (20 MB)" }[status];
  return <div className="flex h-[calc(100dvh-97px-3.5rem-env(safe-area-inset-bottom))] min-w-0 flex-col md:h-[calc(100dvh-57px)]">
    <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
      <Link href="/dashboard/whiteboards" className="inline-flex items-center gap-1 px-2 text-sm text-muted-foreground hover:text-foreground"><RiArrowLeftLine className="size-4" />Quadro branco</Link>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{board?.title ?? "Quadro"}</h1>
      <span role="status" className={`flex items-center gap-1 text-xs ${status === "error" || status === "large" ? "text-destructive" : "text-muted-foreground"}`}>{status === "saving" && <RiLoader4Line className="size-3.5 animate-spin" />}{label}</span>
      <Dropdown trigger={<Button variant="outline" size="sm" disabled={status === "loading"} />} label={<><RiDownloadLine />Exportar</>} align="end">
        <DropdownItem onClick={() => void exportAs("png")}>Imagem PNG</DropdownItem>
        <DropdownItem onClick={() => void exportAs("svg")}>Vetor SVG</DropdownItem>
        <DropdownItem onClick={() => void exportAs("excalidraw")}>Arquivo .excalidraw</DropdownItem>
      </Dropdown>
    </header>
    {!loaded || (board && content === null && status !== "error") ? <LoadingBlock label="Abrindo quadro" className="p-6" />
      : !board ? <p className="p-6 text-sm">Quadro não encontrado.</p>
      : content === null ? <p role="alert" className="p-6 text-sm text-destructive">Não foi possível abrir o quadro.</p>
      : <div className="relative isolate min-h-0 flex-1"><ExcalidrawCanvas content={content} dark={dark} onChange={changed} onReady={handle => { editor.current = handle; setStatus("saved"); }} /></div>}
  </div>;
}
