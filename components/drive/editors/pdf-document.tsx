"use client";
import { type ChangeEvent, type ComponentType, type KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiArrowUpSLine,
  RiClockwiseLine,
  RiCursorLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiImageAddLine,
  RiMarkPenLine,
  RiPencilLine,
  RiPrinterLine,
  RiSaveLine,
  RiSearchLine,
  RiSidebarFoldLine,
  RiSubtractLine,
  RiText,
} from "@remixicon/react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { Input } from "@/components/ui/input";
import { LoadingBlock as LoadingSkeleton } from "@/components/ui/feedback";
import { saveBlob } from "@/lib/drive/files";
import { loadPdfViewer, openPdf, pdfjs } from "@/lib/drive/editors/pdf-engine";

const { AnnotationEditorParamsType: Param, AnnotationEditorType: Editor } = pdfjs;
type Tool = "select" | "ink" | "highlight" | "text" | "image";
type Viewer = {
  annotationEditorMode: { mode: number };
  currentScale: number;
  currentScaleValue: string;
  currentPageNumber: number;
  pagesRotation: number;
  setDocument: (pdf: PDFDocumentProxy) => void;
};
type Bus = { dispatch: (name: string, data: Record<string, unknown>) => void };

const MODES: Record<Tool, number> = { select: Editor.NONE, ink: Editor.INK, highlight: Editor.HIGHLIGHT, text: Editor.FREETEXT, image: Editor.STAMP };
const TOOLS: { tool: Tool; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { tool: "select", label: "Selecionar", icon: RiCursorLine },
  { tool: "ink", label: "Desenhar", icon: RiPencilLine },
  { tool: "highlight", label: "Realçar", icon: RiMarkPenLine },
  { tool: "text", label: "Texto", icon: RiText },
];
const COLOR_PARAM: Partial<Record<Tool, number>> = { ink: Param.INK_COLOR, highlight: Param.HIGHLIGHT_COLOR, text: Param.FREETEXT_COLOR };
const SIZE_PARAM: Partial<Record<Tool, { param: number; min: number; max: number }>> = {
  ink: { param: Param.INK_THICKNESS, min: 1, max: 20 },
  text: { param: Param.FREETEXT_SIZE, min: 6, max: 72 },
};

function PdfThumbnail({ pdf, page, rotation, current, onSelect }: { pdf: PDFDocumentProxy; page: number; rotation: number; current: boolean; onSelect: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    let task: { cancel: () => void } | undefined;
    // Só desenha a miniatura quando ela entra na tela, para documentos longos não travarem a abertura.
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const proxy = await pdf.getPage(page);
      const base = proxy.getViewport({ scale: 1, rotation: proxy.rotate + rotation });
      const viewport = proxy.getViewport({ scale: 140 / base.width, rotation: proxy.rotate + rotation });
      target.width = viewport.width;
      target.height = viewport.height;
      const render = proxy.render({ canvas: target, viewport });
      task = render;
      await render.promise.catch(() => {});
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
      task?.cancel();
    };
  }, [pdf, page, rotation]);
  return (
    <button type="button" aria-label={`Página ${page}`} aria-current={current ? "page" : undefined} onClick={onSelect} className="grid justify-items-center gap-1 rounded-lg p-1.5 text-xs hover:bg-muted aria-[current=page]:bg-primary/10 aria-[current=page]:font-medium">
      <canvas ref={canvas} width={140} height={190} className="max-w-full border bg-white shadow-sm" />
      {page}
    </button>
  );
}

// Visualizador e editor de PDF: as anotações são gravadas no próprio arquivo e continuam editáveis em outros leitores.
export function PdfDocument({ file, name, onSave }: { file: Blob; name: string; onSave?: (edited: Blob) => Promise<void> }) {
  const container = useRef<HTMLDivElement>(null);
  const pages = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const engine = useRef<{ viewer: Viewer; bus: Bus } | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [tool, setTool] = useState<Tool>("select");
  const [colors, setColors] = useState({ ink: "#e11d48", highlight: "#ffff98", text: "#111111" });
  const [sizes, setSizes] = useState({ ink: 3, text: 14 });
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [sidebar, setSidebar] = useState(true);
  const [search, setSearch] = useState<string | null>(null);
  const [matches, setMatches] = useState({ current: 0, total: 0 });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let task: ReturnType<typeof openPdf> | undefined;
    void (async () => {
      const { EventBus, PDFFindController, PDFLinkService, PDFViewer } = await loadPdfViewer();
      const data = new Uint8Array(await file.arrayBuffer());
      if (!active || !container.current || !pages.current) return;
      const eventBus = new EventBus();
      const linkService = new PDFLinkService({ eventBus });
      const findController = new PDFFindController({ eventBus, linkService });
      const viewer = new PDFViewer({ container: container.current, viewer: pages.current, eventBus, linkService, findController, annotationEditorMode: Editor.NONE, annotationEditorHighlightColors: "yellow=#FFFF98,green=#53FFBC,blue=#80EBFF,pink=#FFCBE6,red=#FF4F5F" }) as unknown as Viewer;
      linkService.setViewer(viewer);
      eventBus.on("pagesinit", () => { viewer.currentScaleValue = "page-width"; });
      eventBus.on("pagechanging", ({ pageNumber }: { pageNumber: number }) => setPage(pageNumber));
      eventBus.on("scalechanging", ({ scale }: { scale: number }) => setZoom(Math.round(scale * 100)));
      eventBus.on("updatefindmatchescount", ({ matchesCount }: { matchesCount: { current: number; total: number } }) => setMatches(matchesCount));
      eventBus.on("updatefindcontrolstate", ({ matchesCount }: { matchesCount: { current: number; total: number } }) => setMatches(matchesCount));
      task = openPdf(data);
      const document = await task.promise;
      if (!active) return;
      // A tipagem da biblioteca declara os avisos só como null.
      const storage = document.annotationStorage as unknown as { onSetModified: () => void; onResetModified: () => void };
      storage.onSetModified = () => setDirty(true);
      storage.onResetModified = () => setDirty(false);
      viewer.setDocument(document);
      linkService.setDocument(document);
      engine.current = { viewer, bus: eventBus };
      setPdf(document);
    })().catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error && cause.name === "PasswordException" ? "Este PDF é protegido por senha." : "Não foi possível abrir este PDF.");
    });
    return () => {
      active = false;
      engine.current = null;
      void task?.destroy();
    };
  }, [file]);

  function setParam(type: number, value: unknown) {
    engine.current?.bus.dispatch("switchannotationeditorparams", { source: null, type, value });
  }

  function choose(next: Tool) {
    if (!engine.current) return;
    engine.current.viewer.annotationEditorMode = { mode: MODES[next] };
    setTool(next);
    const colorParam = COLOR_PARAM[next];
    if (colorParam && next !== "select" && next !== "image") setParam(colorParam, colors[next]);
    const sizeParam = SIZE_PARAM[next];
    if (sizeParam && (next === "ink" || next === "text")) setParam(sizeParam.param, sizes[next]);
  }

  function changeColor(value: string) {
    if (tool !== "ink" && tool !== "highlight" && tool !== "text") return;
    setColors((current) => ({ ...current, [tool]: value }));
    const colorParam = COLOR_PARAM[tool];
    if (colorParam) setParam(colorParam, value);
  }

  function changeSize(value: number) {
    if (tool !== "ink" && tool !== "text") return;
    setSizes((current) => ({ ...current, [tool]: value }));
    const sizeParam = SIZE_PARAM[tool];
    if (sizeParam) setParam(sizeParam.param, value);
  }

  function addImage(event: ChangeEvent<HTMLInputElement>) {
    const bitmapFile = event.target.files?.[0];
    event.target.value = "";
    if (!bitmapFile) return;
    choose("image");
    // A camada de edição só fica pronta depois da troca de modo.
    window.setTimeout(() => setParam(Param.CREATE, { bitmapFile }), 100);
  }

  function find(query: string, again = false, previous = false) {
    engine.current?.bus.dispatch("find", { source: null, type: again ? "again" : "", query, caseSensitive: false, entireWord: false, highlightAll: true, findPrevious: previous, matchDiacritics: false });
  }

  function openSearch() {
    setSearch((current) => current ?? "");
    window.setTimeout(() => searchInput.current?.select());
  }

  function closeSearch() {
    setSearch(null);
    setMatches({ current: 0, total: 0 });
    find("");
  }

  function action(name: "undo" | "redo" | "delete") {
    engine.current?.bus.dispatch("editingaction", { source: null, name });
  }

  function setScale(next: number) {
    if (engine.current) engine.current.viewer.currentScale = Math.min(4, Math.max(0.25, next));
  }

  function goTo(next: number) {
    if (engine.current && pdf && next >= 1 && next <= pdf.numPages) engine.current.viewer.currentPageNumber = next;
  }

  function rotate() {
    if (!engine.current) return;
    const next = (rotation + 90) % 360;
    engine.current.viewer.pagesRotation = next;
    setRotation(next);
  }

  async function edited() {
    if (!pdf) return file;
    return new Blob([new Uint8Array(await pdf.saveDocument())], { type: "application/pdf" });
  }

  async function save() {
    if (!onSave || !pdf) return;
    setBusy(true);
    setError("");
    try {
      await onSave(await edited());
      pdf.annotationStorage.resetModified();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    try {
      saveBlob(await edited(), name);
    } catch {
      setError("Não foi possível baixar.");
    }
  }

  async function print() {
    try {
      const url = URL.createObjectURL(await edited());
      const frame = document.createElement("iframe");
      frame.hidden = true;
      frame.src = url;
      frame.onload = () => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        window.setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(url);
        }, 60000);
      };
      document.body.append(frame);
    } catch {
      setError("Não foi possível imprimir.");
    }
  }

  function shortcuts(event: KeyboardEvent) {
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === "s") {
      event.preventDefault();
      if (dirty && onSave) void save();
    } else if (key === "f") {
      event.preventDefault();
      openSearch();
    } else if (key === "p") {
      event.preventDefault();
      void print();
    }
  }

  const color = tool === "ink" || tool === "highlight" || tool === "text" ? colors[tool] : null;
  const size = tool === "ink" || tool === "text" ? { value: sizes[tool], ...SIZE_PARAM[tool]! } : null;
  const status = busy ? "Salvando…" : dirty ? "Alterações não salvas" : "";
  const iconButton = "shrink-0";

  return (
    <div onKeyDown={shortcuts} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
      <div role="toolbar" aria-label="Ferramentas do PDF" className="flex flex-wrap items-center gap-1 border-b p-1.5">
        <Button type="button" variant="ghost" size="icon-sm" className={iconButton} aria-label="Miniaturas" title="Miniaturas" aria-pressed={sidebar} onClick={() => setSidebar((value) => !value)}><RiSidebarFoldLine /></Button>
        <span className="mx-1 h-5 w-px bg-border" />
        {TOOLS.map(({ tool: entry, label, icon: Icon }) => (
          <Button key={entry} type="button" variant={tool === entry ? "secondary" : "ghost"} size="sm" aria-pressed={tool === entry} title={label} disabled={!pdf} onClick={() => choose(entry)}>
            <Icon className="size-4" /><span className="hidden lg:inline">{label}</span>
          </Button>
        ))}
        <Button type="button" variant={tool === "image" ? "secondary" : "ghost"} size="sm" title="Imagem ou assinatura" disabled={!pdf} onClick={() => picker.current?.click()}>
          <RiImageAddLine className="size-4" /><span className="hidden lg:inline">Imagem</span>
        </Button>
        <input ref={picker} type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={addImage} />
        {color && <input type="color" aria-label="Cor" title="Cor" value={color} onChange={(event) => changeColor(event.target.value)} className="size-7 shrink-0 cursor-pointer rounded border bg-transparent p-0.5" />}
        {size && <input type="range" aria-label={tool === "ink" ? "Espessura" : "Tamanho do texto"} title={tool === "ink" ? "Espessura" : "Tamanho do texto"} min={size.min} max={size.max} value={size.value} onChange={(event) => changeSize(Number(event.target.value))} className="w-20 accent-primary" />}
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!pdf} onClick={() => action("undo")}><RiArrowGoBackLine /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Refazer" title="Refazer (Ctrl+Y)" disabled={!pdf} onClick={() => action("redo")}><RiArrowGoForwardLine /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Excluir anotação" title="Excluir anotação selecionada (Del)" disabled={!pdf} onClick={() => action("delete")}><RiDeleteBinLine /></Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Reduzir" title="Reduzir" disabled={!pdf} onClick={() => setScale(zoom / 100 - 0.1)}><RiSubtractLine /></Button>
        <button type="button" className="w-12 rounded text-center text-xs tabular-nums hover:bg-muted" title="Ajustar à largura" disabled={!pdf} onClick={() => { if (engine.current) engine.current.viewer.currentScaleValue = "page-width"; }}>{zoom}%</button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Ampliar" title="Ampliar" disabled={!pdf} onClick={() => setScale(zoom / 100 + 0.1)}><RiAddLine /></Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Girar páginas" title="Girar páginas" disabled={!pdf} onClick={rotate}><RiClockwiseLine /></Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <span className="flex items-center gap-1 text-xs tabular-nums">
          <Input aria-label="Página" key={page} defaultValue={page} className="h-7 w-11 px-1 text-center text-xs" onKeyDown={(event) => { if (event.key === "Enter") goTo(Number(event.currentTarget.value)); }} />
          / {pdf?.numPages ?? "–"}
        </span>
        <span className="ml-auto flex items-center gap-1">
          {status && <span role="status" className="px-1 text-xs text-muted-foreground">{status}</span>}
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Localizar" title="Localizar (Ctrl+F)" disabled={!pdf} onClick={openSearch}><RiSearchLine /></Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Imprimir" title="Imprimir (Ctrl+P)" disabled={!pdf} onClick={() => void print()}><RiPrinterLine /></Button>
          <Button type="button" variant="ghost" size="sm" disabled={!pdf} onClick={() => void download()}><RiDownloadLine className="size-4" /><span className="hidden lg:inline">Baixar</span></Button>
          {onSave && <Button type="button" size="sm" disabled={!pdf || busy || !dirty} onClick={() => void save()}><RiSaveLine className="size-4" />Salvar</Button>}
        </span>
      </div>
      {search !== null && (
        <div className="flex items-center gap-1 border-b p-1.5">
          <Input
            ref={searchInput}
            aria-label="Localizar no documento"
            placeholder="Localizar no documento"
            value={search}
            className="h-7 max-w-64 text-xs"
            onChange={(event) => { setSearch(event.target.value); find(event.target.value); }}
            onKeyDown={(event) => {
              if (event.key === "Enter") find(search, true, event.shiftKey);
              if (event.key === "Escape") closeSearch();
            }}
          />
          <span className="px-1 text-xs tabular-nums text-muted-foreground">{search ? `${matches.current} de ${matches.total}` : ""}</span>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Anterior" onClick={() => find(search, true, true)}><RiArrowUpSLine /></Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Próxima" onClick={() => find(search, true)}><RiArrowDownSLine /></Button>
          <Button type="button" variant="ghost" size="sm" onClick={closeSearch}>Fechar</Button>
        </div>
      )}
      <ErrorToast message={error} />
      {!pdf && !error && <LoadingSkeleton label="Abrindo PDF…" />}
      <div className={`flex min-h-0 flex-1 ${pdf ? "" : "invisible h-0 flex-none"}`}>
        {sidebar && pdf && (
          <nav aria-label="Páginas" className="hidden w-44 shrink-0 overflow-y-auto border-r bg-muted/40 p-2 md:grid md:content-start md:gap-1">
            {Array.from({ length: pdf.numPages }, (_, index) => (
              <PdfThumbnail key={index} pdf={pdf} page={index + 1} rotation={rotation} current={page === index + 1} onSelect={() => goTo(index + 1)} />
            ))}
          </nav>
        )}
        <div className="relative min-w-0 flex-1 bg-muted/60">
          {/* O visualizador exige um contêiner com posição absoluta. */}
          <div ref={container} className="absolute inset-0 overflow-auto">
            <div ref={pages} className="pdfViewer" />
          </div>
        </div>
      </div>
    </div>
  );
}
