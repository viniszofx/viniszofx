"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingBlock } from "@/components/ui/feedback";
import { RiAddLine as Plus, RiDeleteBinLine as Trash2, RiFlowChart as Flow, RiUploadLine as Upload, RiCloseLine as Close, RiShapesLine as Shapes } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CatalogCreate, CatalogFooter, CatalogLayout, CatalogPreview, CatalogSearch, CatalogTile, catalogGrid } from "@/components/listing/catalog";
import { NameDialog } from "@/components/ui/name-dialog";
import { fieldsOf, matchesText } from "@/lib/records/store";
import { diagramStore, drawioLibraryStore, type Diagram, type DrawioLibrary } from "@/lib/nodus/stores";
import { drawioConfig, editorLibraryId, nativeLibraries, parseLibraryFile, readLibraryChoice, storeLibraryChoice, type LibraryChoice } from "@/lib/nodus/drawio-libraries";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";
import { PublicLinkDialog, newShareToken } from "@/components/ui/public-link";

const editorUrl = process.env.NEXT_PUBLIC_DRAWIO_URL || "https://embed.diagrams.net";
const editorOrigin = new URL(editorUrl).origin;

function Editor({ diagram, libraries, choice, onClose, onLibraries }: { diagram: Diagram; libraries: DrawioLibrary[]; choice: LibraryChoice; onClose: () => void; onLibraries: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(diagram);
  const [status, setStatus] = useState("Abrindo editor…");
  const active = useMemo(() => libraries.filter(library => !choice.hidden.includes(library.id)), [libraries, choice.hidden]);
  const libs = [...choice.native, ...active.map(library => editorLibraryId(library.id))].join(";");
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const src = `${editorUrl}/?${new URLSearchParams({ embed: "1", proto: "json", spin: "1", lang: "pt", saveAndExit: "0", noSaveBtn: "1", libraries: "1", configure: "1", ui: "min", dark: dark ? "1" : "0", libs })}`;
  useEffect(() => {
    const post = (message: object) => frame.current?.contentWindow?.postMessage(JSON.stringify(message), editorOrigin);
    function receive(event: MessageEvent) {
      if (event.origin !== editorOrigin || event.source !== frame.current?.contentWindow || typeof event.data !== "string") return;
      let message: { event?: string; xml?: string; data?: string };
      try { message = JSON.parse(event.data); } catch { return; }
      // Com configure=1 o draw.io espera esta resposta antes de abrir: entrega as bibliotecas próprias.
      if (message.event === "configure") post({ action: "configure", config: drawioConfig(active) });
      if (message.event === "init") { post({ action: "load", xml: latest.current.xml, autosave: 1, title: latest.current.title }); setStatus("Salvamento automático ativo"); }
      if ((message.event === "autosave" || message.event === "save") && message.xml !== undefined) {
        latest.current = { ...latest.current, xml: message.xml };
        diagramStore.save({ ...fieldsOf(latest.current), xml: message.xml }, diagram.id, { silent: true });
        setStatus("Salvo");
        post({ action: "export", format: "svg", spin: false });
      }
      // The SVG export doubles as the catalog thumbnail.
      if (message.event === "export" && message.data && message.data.length < 2_000_000) {
        latest.current = { ...latest.current, thumbnail: message.data };
        diagramStore.save({ ...fieldsOf(latest.current) }, diagram.id, { silent: true });
      }
      if (message.event === "exit") onClose();
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [diagram.id, onClose, active]);
  return <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-label={`Editor: ${diagram.title}`}>
    <header className="flex items-center gap-3 border-b px-4 py-2"><Flow className="size-4 text-primary" /><h2 className="min-w-0 flex-1 truncate font-semibold">{diagram.title}</h2><span className="text-xs text-muted-foreground" aria-live="polite">{status}</span><Button variant="outline" size="sm" onClick={onLibraries}><Shapes />Bibliotecas</Button><Button variant="outline" size="sm" onClick={onClose}><Close />Fechar</Button></header>
    <iframe key={src} ref={frame} src={src} title="Editor draw.io" className="min-h-0 w-full flex-1 border-0" />
  </div>;
}

function LibrariesDialog({ choice, libraries, onChange, onClose }: { choice: LibraryChoice; libraries: DrawioLibrary[]; onChange: (choice: LibraryChoice) => void; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<DrawioLibrary | null>(null);
  const toggleNative = (id: string) => onChange({ ...choice, native: choice.native.includes(id) ? choice.native.filter(item => item !== id) : [...choice.native, id] });
  const toggleOwn = (id: string) => onChange({ ...choice, hidden: choice.hidden.includes(id) ? choice.hidden.filter(item => item !== id) : [...choice.hidden, id] });
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return notifyError("Arquivo muito grande", "Bibliotecas podem ter até 5 MB.");
    try {
      const { content, shapes } = parseLibraryFile(await file.text());
      drawioLibraryStore.save({ title: file.name.replace(/\.xml$/i, ""), content }, undefined, { silent: true });
      notifySuccess(`Biblioteca adicionada com ${shapes} forma(s).`);
    } catch (cause) { notifyError("Biblioteca não importada", cause instanceof Error ? cause.message : ""); }
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
    <DialogTitle>Bibliotecas de formas</DialogTitle><DialogDescription>Escolha as bibliotecas que aparecem ao abrir o editor. A escolha fica neste navegador.</DialogDescription>
    <div className="grid gap-5 sm:grid-cols-2">{nativeLibraries.map(group => <fieldset key={group.group} className="space-y-2"><legend className="mb-1 text-sm font-semibold">{group.group}</legend>{group.items.map(([id, label]) => <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={choice.native.includes(id)} onChange={() => toggleNative(id)} />{label}</label>)}</fieldset>)}</div>
    <section className="space-y-2 border-t pt-4"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Minhas bibliotecas</h3><Button size="sm" variant="outline" onClick={() => input.current?.click()}><Upload />Importar .xml</Button></div>
      <input ref={input} type="file" accept=".xml" hidden aria-label="Importar biblioteca" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
      {!libraries.length && <p className="text-xs text-muted-foreground">No draw.io, use Arquivo › Exportar biblioteca e importe o .xml aqui.</p>}
      <ul className="divide-y border">{libraries.map(library => <li key={library.id} className="flex items-center gap-2 px-3 py-2 text-sm"><label className="flex flex-1 items-center gap-2"><input type="checkbox" checked={!choice.hidden.includes(library.id)} onChange={() => toggleOwn(library.id)} />{library.title}</label><Button variant="ghost" size="icon-sm" aria-label={`Excluir biblioteca ${library.title}`} onClick={() => setDeleting(library)}><Trash2 /></Button></li>)}</ul>
    </section>
    <div className="flex justify-end"><Button onClick={onClose}>Concluído</Button></div>
    {deleting && <ConfirmDialog title="Excluir biblioteca?" description={`${deleting.title} deixa de aparecer no editor. Os diagramas que já usam as formas não mudam.`} onConfirm={() => drawioLibraryStore.remove(deleting.id)} onClose={() => setDeleting(null)} />}
  </DialogContent></Dialog>;
}

export function DiagramsPage() {
  const { records, loaded } = diagramStore.useRecords();
  const libraries = drawioLibraryStore.useRecords().records;
  const [openId, setOpenId] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Diagram | null>(null);
  const [renaming, setRenaming] = useState<Diagram | null>(null);
  const [sharingId, setSharingId] = useState("");
  const sharing = records.find(diagram => diagram.id === sharingId);
  const [choice, setChoice] = useState<LibraryChoice>(() => typeof window === "undefined" ? { native: [], hidden: [] } : readLibraryChoice());
  const [pickingLibraries, setPickingLibraries] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const open = records.find(diagram => diagram.id === openId);
  const visible = records.filter(diagram => matchesText([diagram.title, diagram.code], search)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  function create(title = "Novo diagrama", xml = "") {
    const record = diagramStore.save({ title, xml, thumbnail: "" });
    if (record) setOpenId(record.id);
  }
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return notifyError("Arquivo muito grande", "Diagramas podem ter até 20 MB.");
    const xml = await file.text();
    if (!xml.includes("<mxfile") && !xml.includes("<mxGraphModel")) return notifyError("Arquivo inválido", "Escolha um arquivo .drawio ou .xml exportado do draw.io.");
    create(file.name.replace(/\.(drawio|xml)$/i, ""), xml);
  }
  function changeChoice(next: LibraryChoice) { setChoice(next); storeLibraryChoice(next); }

  return <CatalogLayout section="Ferramentas" title="Diagramas" description="Fluxogramas, plantas, redes e racks no draw.io, com salvamento automático." action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setPickingLibraries(true)}><Shapes />Bibliotecas</Button><Button variant="outline" disabled={!loaded} onClick={() => input.current?.click()}><Upload />Importar</Button><Button disabled={!loaded} onClick={() => create()}><Plus />Novo diagrama</Button></div>}>
    <input ref={input} type="file" accept=".drawio,.xml" className="hidden" aria-label="Importar diagrama" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ""; }} />
    <CatalogSearch label="Buscar diagramas" value={search} onChange={setSearch} />
    {!loaded ? <LoadingBlock label="Carregando diagramas" /> : <div className={catalogGrid}>{visible.map(diagram => <CatalogTile key={diagram.id}>
      <button className="text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOpenId(diagram.id)} aria-label={`Abrir ${diagram.title}`}>
        <CatalogPreview style={{ background: "white" }}>{diagram.thumbnail ? <img src={diagram.thumbnail} alt="" className="size-full object-contain p-2" /> : <Flow className="size-8 text-primary" />}</CatalogPreview>
        <div className="p-4"><h2 className="truncate font-semibold">{diagram.title}</h2><p className="text-xs text-muted-foreground">Atualizado {new Date(diagram.updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p></div>
      </button>
      <CatalogFooter><div className="flex"><Button variant="ghost" size="xs" onClick={() => setRenaming(diagram)}>Renomear</Button><Button variant="ghost" size="xs" onClick={() => setSharingId(diagram.id)}>{diagram.shareToken ? "Link público" : "Compartilhar"}</Button></div><Button variant="ghost" size="icon-sm" aria-label={`Excluir ${diagram.title}`} onClick={() => setDeleting(diagram)}><Trash2 /></Button></CatalogFooter>
    </CatalogTile>)}{!search.trim() && <CatalogCreate label="Novo diagrama" onClick={() => create()} />}</div>}
    <p className="text-xs text-muted-foreground">Use o menu Arquivo do editor para exportar em PNG, SVG ou .drawio.</p>
    {open && <Editor key={open.id} diagram={open} libraries={libraries} choice={choice} onClose={() => setOpenId("")} onLibraries={() => setPickingLibraries(true)} />}
    {pickingLibraries && <LibrariesDialog choice={choice} libraries={libraries} onChange={changeChoice} onClose={() => setPickingLibraries(false)} />}
    {renaming && <NameDialog title="Renomear diagrama" initial={renaming.title} submitLabel="Renomear" onSubmit={title => { diagramStore.save({ ...fieldsOf(renaming), title }, renaming.id); }} onClose={() => setRenaming(null)} />}
    {sharing && <PublicLinkDialog title="Compartilhar diagrama" name={sharing.title} what="o diagrama" path={sharing.shareToken ? `/diagrama/${sharing.shareToken}` : null} onCreate={() => diagramStore.save({ ...fieldsOf(sharing), shareToken: newShareToken() }, sharing.id)} onRemove={() => { const fields = { ...fieldsOf(sharing) }; delete fields.shareToken; diagramStore.save(fields, sharing.id); }} onClose={() => setSharingId("")} />}
    {deleting && <ConfirmDialog title="Excluir diagrama?" description={`${deleting.title} será removido.`} onConfirm={() => diagramStore.remove(deleting.id)} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
