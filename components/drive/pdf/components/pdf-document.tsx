import { type ChangeEvent, type ComponentType, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import {
  RiAddLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiBookOpenLine,
  RiChat1Line,
  RiCheckLine,
  RiClockwiseLine,
  RiCursorLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiEditLine,
  RiEqualizerLine,
  RiExpandWidthLine,
  RiFileLine,
  RiImageAddLine,
  RiLayoutGridLine,
  RiLayoutTopLine,
  RiMarkPenLine,
  RiMoreLine,
  RiPencilLine,
  RiPrinterLine,
  RiSaveLine,
  RiSearchLine,
  RiSidebarFoldLine,
  RiSubtractLine,
  RiText,
} from "@remixicon/react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { isRefId, type ParsedNote, readNotes } from "../annotations/mod";
import { Button } from "@/components/ui/button";
import { ErrorToast } from "@/components/ui/error-toast";
import { toast } from "../compat";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingBlock } from "@/components/ui/feedback";
import { authClient } from "@/lib/auth/client";
import { type PdfCommentAction, saveBlob } from "../compat";
import { loadPdfViewer, openPdf, pdfjs } from "../pdf-engine";
import { type Area, containsPoint, isNarrow, overlaps, PAGE_SELECTOR, pageArea, pageElement, pageNumberOf, placeOnPage, scrollOrigin } from "../pdf-geometry";
import { type Comment, type CommentDraft, type HighlightBox, markSaved, type PlainHighlight, quoteFrom, readViewerAnnotations, reconcileThreads, removeFrom, type Reply, unsaved } from "../pdf-model";
import { includeLettersUnderPointer, selectionBoxes } from "../pdf-selection";
import { stampPages, type StampOptions } from "../pdf-stamp";
import { FAMILY_CSS, fontStyleOf, nearestLine, sampleColors, type TextEdit, viewBoxOf } from "../pdf-text-edit";
import { collectChanges, DEFAULT_HIGHLIGHT, hasChangesToWrite, writeAnnotations } from "../pdf-write";
import { PdfCommentsPanel, type Thread } from "./pdf-comments-panel";
import { PdfControlsPanel } from "./pdf-controls-panel";
import { type ContextMenuState, MenuItem, MenuSeparator, PdfContextMenu, PdfSearchBar, PdfSelectionBar, PdfZoomInput, ViewMenuItems } from "./pdf-menus";
import { PdfOrganizer } from "./pdf-organizer";
import { PdfPaginationDialog } from "./pdf-pagination-dialog";
import { PdfThumbnails } from "./pdf-thumbnails";
import { defaultZoom, isZoomPreset, type PdfSync, readStoredSpread, SPREADS, storeSpread, useDismiss, usePinchZoom, useVersionSync, type ZoomPreset } from "./pdf-viewer-hooks";

export type { PdfSync };

const { AnnotationEditorParamsType: Param, AnnotationEditorType: Editor } = pdfjs;
type Tool = "select" | "edittext" | "ink" | "highlight" | "text" | "image" | "comment";
type ColorTool = "ink" | "highlight" | "text";
type SizeTool = "ink" | "text";
type SelectionState = CommentDraft & { left: number; top: number; barLeft: number; barTop: number };
type CommentMarker = { id: string; left: number; top: number; index: number };
type PaintedBox = Area & { id: string; color?: string; paint: boolean };
type TextContent = Awaited<ReturnType<PDFPageProxy["getTextContent"]>>;
type Viewer = {
  annotationEditorMode: { mode: number; editId?: string };
  currentScale: number;
  currentScaleValue: string;
  currentPageNumber: number;
  pagesRotation: number;
  spreadMode: number;
  refresh: () => void;
  setDocument: (pdf: PDFDocumentProxy) => void;
};
type Bus = { dispatch: (name: string, data: Record<string, unknown>) => void };

const MODES: Record<Tool, number> = { select: Editor.NONE, edittext: Editor.NONE, ink: Editor.INK, highlight: Editor.HIGHLIGHT, text: Editor.FREETEXT, image: Editor.STAMP, comment: Editor.NONE };
const TOOLS: { tool: Tool; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { tool: "select", label: "Selecionar", icon: RiCursorLine },
  { tool: "ink", label: "Desenhar", icon: RiPencilLine },
  { tool: "highlight", label: "Realçar", icon: RiMarkPenLine },
  { tool: "edittext", label: "Editar texto", icon: RiEditLine },
  { tool: "text", label: "Texto", icon: RiText },
];
// Cores do marca-texto: as mesmas da paleta do pdf.js.
const HIGHLIGHT_COLORS = ["#ffff98", "#53ffbc", "#80ebff", "#ffcbe6", "#ff4f5f"];
const COLOR_PARAM: Record<ColorTool, number> = { ink: Param.INK_COLOR, highlight: Param.HIGHLIGHT_COLOR, text: Param.FREETEXT_COLOR };
const SIZE_PARAM: Record<SizeTool, { param: number; min: number; max: number }> = {
  ink: { param: Param.INK_THICKNESS, min: 1, max: 20 },
  text: { param: Param.FREETEXT_SIZE, min: 6, max: 72 },
};
const isColorTool = (tool: Tool): tool is ColorTool => tool in COLOR_PARAM;
const isSizeTool = (tool: Tool): tool is SizeTool => tool in SIZE_PARAM;
// Itens que a ferramenta Selecionar abre na ferramenta deles: imagem, desenho e caixa de texto, em edição ou já no arquivo.
const OBJECT_KINDS: [string, Tool][] = [["stamp", "image"], ["ink", "ink"], ["freeText", "text"]];
const EDITORS = ".annotationEditorLayer :is(.stampEditor,.inkEditor,.freeTextEditor)";
const OBJECTS = `${EDITORS}, .annotationLayer :is(.stampAnnotation,.inkAnnotation,.freeTextAnnotation)`;

const LOCKED_MESSAGE = "Este PDF é protegido contra edição. Realces e comentários não podem ser gravados nele.";
const unit = (value: number) => Math.min(1, Math.max(0, value));
const clampScale = (value: number) => Math.min(4, Math.max(0.25, value));
const pdfBlob = (bytes: Uint8Array) => new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
// Atualiza a lista só quando ela mudou, para a medição a cada desenho da página não redesenhar a tela à toa.
const unlessSame = <T,>(next: T) => (current: T) => JSON.stringify(current) === JSON.stringify(next) ? current : next;

function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
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
}

// Visualizador e editor de PDF: as anotações são gravadas no próprio arquivo e continuam editáveis em outros leitores.
// `leading` (ex.: Voltar e o nome) entra no começo da barra de ferramentas, que fica sendo a única acima do PDF.
export function PdfDocument({ file, name, onSave, onDirtyChange, sync, leading }: { file: Blob; name: string; onSave?: (edited: Blob) => Promise<void>; onDirtyChange?: (dirty: boolean) => void; sync?: PdfSync; leading?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const pages = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const engine = useRef<{ viewer: Viewer; bus: Bus } | null>(null);
  // Comentários que já vêm no arquivo aberto (o pdf.js desenha os deles).
  const sourceCommentIds = useRef(new Set<string>());
  // Respostas e marcas de revisão que já vêm no arquivo: o pdf.js não desenha o ícone delas sobre a página.
  const threadAnnotationIds = useRef(new Set<string>());
  // Texto de cada página, lido uma vez: para editar texto e para o trecho comentado.
  const textContents = useRef(new Map<number, Promise<{ page: PDFPageProxy; content: TextContent }>>());
  const quoted = useRef(new Set<string>());
  const erasedIds = useRef(new Set<string>());
  const dragStart = useRef<{ x: number; y: number; page: number } | null>(null);
  const nativeHighlight = useRef<HTMLElement | null>(null);
  const knownVersion = useRef<string | null>(null);
  const threadState = useRef<{ comments: Comment[]; replies: Reply[] }>({ comments: [], replies: [] });
  // Ajuste automático em uso; o PDF abre com a página inteira (no celular, na largura, para dar para ler).
  const zoomPreset = useRef<ZoomPreset | null>(defaultZoom());
  const [spread, setSpread] = useState(readStoredSpread);
  const spreadRef = useRef(spread);

  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  // Depois de organizar as páginas, o visualizador passa a mostrar o PDF montado até o usuário salvar ou sair.
  const [rebuilt, setRebuilt] = useState<{ from: Blob; blob: Blob; unsaved: boolean } | null>(null);
  const [organizing, setOrganizing] = useState<Uint8Array | null>(null);
  const [paginating, setPaginating] = useState(false);
  // Como no Word: o PDF abre para leitura e as ferramentas aparecem ao entrar em edição.
  const [editMode, setEditMode] = useState(false);
  const [tool, setTool] = useState<Tool>("select");
  const [colors, setColors] = useState<Record<ColorTool, string>>({ ink: "#e11d48", highlight: "#ffff98", text: "#111111" });
  const [sizes, setSizes] = useState<Record<SizeTool, number>>({ ink: 3, text: 14 });
  const [inkOpacity, setInkOpacity] = useState(1);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  // Zoom automático (ajustado à largura ou à página) ou um valor escolhido; o botão de voltar ao automático só aparece no segundo caso.
  const [autoZoom, setAutoZoom] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [sidebar, setSidebar] = useState(true);
  // Painel da direita: controles (aberto por padrão em telas largas) ou comentários.
  const [rightPanel, setRightPanel] = useState<"controls" | "comments" | null>(null);
  const [search, setSearch] = useState<string | null>(null);
  const [matches, setMatches] = useState({ current: 0, total: 0 });
  const [textEdits, setTextEdits] = useState<TextEdit[]>([]);
  const [textDirty, setTextDirty] = useState(false);
  const [textEditor, setTextEditor] = useState<{ edit: TextEdit; left: number; top: number; width: number; height: number; fontPx: number } | null>(null);
  const [editOverlays, setEditOverlays] = useState<{ id: string; left: number; top: number; width: number; height: number; fontPx: number; angle: number }[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [plainHighlights, setPlainHighlights] = useState<PlainHighlight[]>([]);
  const [commentBusy, setCommentBusy] = useState(false);
  const [draft, setDraft] = useState<CommentDraft | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [markers, setMarkers] = useState<CommentMarker[]>([]);
  const [contentWidth, setContentWidth] = useState(Infinity);
  const [highlightBoxes, setHighlightBoxes] = useState<PaintedBox[]>([]);
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [openComment, setOpenComment] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  // No link público o nome vem da página ("Visitante", igual ao servidor), mesmo antes de a sessão anônima existir.
  const me = sync?.author ?? (session?.user.name || "Usuário");

  const current = rebuilt?.from === file ? rebuilt : null;
  const source = current?.blob ?? file;
  const hasChanges = dirty || textDirty || !!current?.unsaved || comments.some((comment) => unsaved(comment) || !!comment.resolvePending) || replies.some(unsaved) || plainHighlights.some(unsaved);
  const commentPanel = rightPanel === "comments";
  // Área do visualizador com tamanho: sem isso, os ajustes automáticos de zoom dão escala inválida.
  const hasRoom = () => !!container.current?.clientHeight && !!container.current.clientWidth;

  useEffect(() => {
    onDirtyChange?.(hasChanges || busy);
  }, [hasChanges, busy, onDirtyChange]);

  // Ao abrir ou fechar um painel, o espaço muda: refaz o ajuste automático em uso (página inteira ou largura).
  // Um zoom escolhido à mão fica como está.
  useEffect(() => {
    if (!pdf) return;
    const frame = requestAnimationFrame(() => {
      if (engine.current && zoomPreset.current && hasRoom()) engine.current.viewer.currentScaleValue = zoomPreset.current;
    });
    return () => cancelAnimationFrame(frame);
  }, [pdf, rightPanel, sidebar, organizing]);

  // Posições no conteúdo rolável: os realces e marcadores rolam junto com a página, sem recalcular a cada rolagem.
  useEffect(() => {
    const viewport = container.current;
    const pageRoot = pages.current;
    if (!viewport || !pageRoot || !pdf) return;
    let frame = 0;
    const hide = (id: string) => {
      for (const element of pageRoot.querySelectorAll<HTMLElement>(`[data-annotation-id="${id}"]`)) element.style.display = "none";
    };
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Anotações do arquivo que o visualizador desenha por conta própria (ou que foram removidas) saem da camada do pdf.js.
        for (const comment of comments) {
          if (!sourceCommentIds.current.has(comment.id)) continue;
          if (!comment.highlighted || comment.removed) hide(comment.id);
          hide(`popup_${comment.id}`);
        }
        for (const highlight of plainHighlights) if (highlight.source && highlight.removed) hide(highlight.id);
        for (const id of threadAnnotationIds.current) {
          hide(id);
          hide(`popup_${id}`);
        }
        const origin = scrollOrigin(viewport);
        // Cada página é medida uma vez por quadro.
        const areas = new Map<number, DOMRect | null>();
        const areaOf = (number: number) => {
          if (!areas.has(number)) {
            const element = pageElement(pageRoot, number);
            areas.set(number, element && pageArea(element));
          }
          return areas.get(number) ?? null;
        };
        const placed = (number: number, boxes: HighlightBox[], extra: { id: string; color?: string; paint: boolean }) => {
          const rect = areaOf(number);
          return rect ? boxes.map((box) => ({ ...placeOnPage(rect, origin, box), ...extra })) : [];
        };
        setMarkers(unlessSame(comments.flatMap((comment, index) => {
          if (comment.removed || comment.resolved) return [];
          const rect = areaOf(comment.page);
          if (!rect) return [];
          const last = comment.boxes?.at(-1);
          return [{ id: comment.id, index: index + 1, left: rect.left + (last?.right ?? comment.x) * rect.width - origin.left + 18, top: rect.top + (last?.top ?? comment.y) * rect.height - origin.top - 18 }];
        })));
        setContentWidth(viewport.scrollWidth);
        setHighlightBoxes(unlessSame([
          ...comments.flatMap((comment) => comment.removed || comment.resolved || sourceCommentIds.current.has(comment.id) || !comment.boxes?.length ? [] : placed(comment.page, comment.boxes, { id: comment.id, paint: true })),
          ...plainHighlights.flatMap((highlight) => highlight.removed ? [] : placed(highlight.page, highlight.boxes, { id: highlight.id, color: highlight.color, paint: !highlight.source })),
        ]));
        setEditOverlays(unlessSame(textEdits.flatMap((edit) => {
          const rect = areaOf(edit.page);
          if (!rect) return [];
          const box = viewBoxOf(edit, rotation);
          const area = placeOnPage(rect, origin, box);
          return [{ id: edit.id, left: area.left, top: area.top, width: area.right - area.left, height: area.bottom - area.top, fontPx: box.font * rect.height, angle: box.angle }];
        })));
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(pageRoot);
    pageRoot.addEventListener("rendered", measure);
    const pageObserver = new MutationObserver(measure);
    pageObserver.observe(pageRoot, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      pageRoot.removeEventListener("rendered", measure);
      pageObserver.disconnect();
    };
  }, [pdf, comments, plainHighlights, textEdits, zoom, rotation, rightPanel, sidebar, page]);

  useEffect(() => { threadState.current = { comments, replies }; }, [comments, replies]);

  function pageText(document: PDFDocumentProxy, number: number) {
    let pending = textContents.current.get(number);
    if (!pending) {
      pending = document.getPage(number).then(async (proxy) => ({ page: proxy, content: await proxy.getTextContent() }));
      // Uma falha não fica guardada: a próxima tentativa lê de novo.
      pending.catch(() => textContents.current.delete(number));
      textContents.current.set(number, pending);
    }
    return pending;
  }

  // O PDF guarda só a área marcada, não o texto: o trecho comentado é lido da página, sob o realce.
  useEffect(() => {
    if (!pdf) return;
    const missing = comments.filter((comment) => !comment.quote && comment.boxes?.length && !quoted.current.has(comment.id));
    if (!missing.length) return;
    for (const comment of missing) quoted.current.add(comment.id);
    void (async () => {
      const found = new Map<string, string>();
      for (const comment of missing) {
        const quote = await pageText(pdf, comment.page).then(({ page, content }) => quoteFrom(page, content, comment.boxes!)).catch(() => "");
        if (quote) found.set(comment.id, quote);
      }
      if (found.size) setComments((list) => list.map((comment) => found.has(comment.id) ? { ...comment, quote: found.get(comment.id) } : comment));
    })();
  }, [pdf, comments]);

  useVersionSync(sync, pdf, knownVersion, reconcile);
  useDismiss(!!contextMenu, () => setContextMenu(null));
  usePinchZoom(container, { get: () => engine.current?.viewer.currentScale, set: setScale });

  useEffect(() => {
    let active = true;
    let task: ReturnType<typeof openPdf> | undefined;
    // Ao trocar de arquivo (páginas reorganizadas), o visualizador anterior para de ouvir a rolagem.
    const stop = new AbortController();
    void (async () => {
      const { EventBus, LinkTarget, PDFFindController, PDFLinkService, PDFViewer } = await loadPdfViewer();
      const data = new Uint8Array(await source.arrayBuffer());
      if (!active || !container.current || !pages.current) return;
      const eventBus = new EventBus();
      // Links externos abrem em outra aba, sem tirar o usuário do Drive.
      const linkService = new PDFLinkService({ eventBus, externalLinkTarget: LinkTarget.BLANK });
      const findController = new PDFFindController({ eventBus, linkService });
      // abortSignal existe no PDFViewer, mas falta na tipagem; com as opções montadas antes, a checagem não reclama.
      const options = { container: container.current, viewer: pages.current, eventBus, linkService, findController, abortSignal: stop.signal, annotationEditorMode: Editor.NONE, annotationEditorHighlightColors: "yellow=#FFFF98,green=#53FFBC,blue=#80EBFF,pink=#FFCBE6,red=#FF4F5F" };
      const viewer = new PDFViewer(options) as unknown as Viewer;
      linkService.setViewer(viewer);
      eventBus.on("pagesinit", () => {
        viewer.spreadMode = spreadRef.current;
        // Enquanto abre, a área do visualizador ainda está oculta (altura 0): o ajuste daria zoom negativo e a rolagem
        // terminaria na última página. Nesse caso o ajuste fica para quando a área aparecer (efeito abaixo).
        if (hasRoom()) viewer.currentScaleValue = zoomPreset.current ?? defaultZoom();
      });
      eventBus.on("pagechanging", ({ pageNumber }: { pageNumber: number }) => setPage(pageNumber));
      eventBus.on("scalechanging", ({ scale, presetValue }: { scale: number; presetValue?: string }) => {
        setZoom(Math.round(scale * 100));
        zoomPreset.current = isZoomPreset(presetValue) ? presetValue : null;
        setAutoZoom(isZoomPreset(presetValue));
      });
      const updateMatches = ({ matchesCount }: { matchesCount: { current: number; total: number } }) => setMatches(matchesCount);
      eventBus.on("updatefindmatchescount", updateMatches);
      eventBus.on("updatefindcontrolstate", updateMatches);
      task = openPdf(data);
      const document = await task.promise;
      if (!active) return;
      // A tipagem da biblioteca declara os avisos só como null.
      const storage = document.annotationStorage as unknown as { onSetModified: () => void; onResetModified: () => void };
      storage.onSetModified = () => setDirty(true);
      storage.onResetModified = () => setDirty(false);
      // O pdf.js só tira do desenho as anotações do arquivo cujo id está em modifiedIds, que ele preenche apenas com as que
      // estão sendo editadas pelas ferramentas dele. Aqui a lista ganha também as removidas por este visualizador.
      erasedIds.current = new Set();
      const modifiedIds = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(document.annotationStorage), "modifiedIds")?.get;
      Object.defineProperty(document.annotationStorage, "modifiedIds", { configurable: true, get() {
        const base = modifiedIds?.call(this) as { ids: Set<string>; hash: string };
        if (!erasedIds.current.size) return base;
        return { ids: new Set([...base.ids, ...erasedIds.current]), hash: `${base.hash}|${[...erasedIds.current].join(",")}` };
      } });
      viewer.setDocument(document);
      linkService.setDocument(document);
      engine.current = { viewer, bus: eventBus };
      textContents.current = new Map();
      setPdf(document);
      setTool("select");
      setRotation(0);
      setSelection(null);
      setDraft(null);
      setContextMenu(null);
      setOpenComment(null);
      setActiveComment(null);
      setTextEdits([]);
      setTextEditor(null);
      setSelectedHighlight(null);
      setTextDirty(false);
      root.current?.focus({ preventScroll: true });
      // Arquivos criptografados (mesmo sem senha para abrir) não aceitam a gravação de realces e comentários.
      void document.getMetadata().then(({ info }) => { if (active) setLocked(!!(info as { EncryptFilterName?: string | null }).EncryptFilterName); }).catch(() => {});
      const found = await readViewerAnnotations(document);
      if (!active) return;
      sourceCommentIds.current = new Set(found.comments.map((comment) => comment.id));
      threadAnnotationIds.current = found.threadIds;
      setComments(found.comments);
      setReplies(found.replies);
      setPlainHighlights(found.highlights);
    })().catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error && cause.name === "PasswordException" ? "Este PDF é protegido por senha." : "Não foi possível abrir este PDF.");
    });
    return () => {
      active = false;
      stop.abort();
      engine.current = null;
      void task?.destroy();
    };
  }, [source]);

  // --- Visualizador: zoom, páginas, giro, busca ---

  function zoomTo(preset: ZoomPreset) {
    if (engine.current) engine.current.viewer.currentScaleValue = preset;
  }

  function setScale(next: number) {
    if (engine.current) engine.current.viewer.currentScale = clampScale(next);
  }

  function goTo(next: number) {
    if (engine.current && pdf && next >= 1 && next <= pdf.numPages) engine.current.viewer.currentPageNumber = next;
  }

  function changeSpread(next: number) {
    spreadRef.current = next;
    setSpread(next);
    storeSpread(next);
    if (!engine.current) return;
    engine.current.viewer.spreadMode = next;
    engine.current.viewer.currentScaleValue = "page-fit";
  }

  function rotate() {
    if (!engine.current) return;
    const next = (rotation + 90) % 360;
    engine.current.viewer.pagesRotation = next;
    setRotation(next);
  }

  function find(query: string, again = false, previous = false) {
    engine.current?.bus.dispatch("find", { source: null, type: again ? "again" : "", query, caseSensitive: false, entireWord: false, highlightAll: true, findPrevious: previous, matchDiacritics: false });
  }

  function findText(query: string) {
    setSearch(query);
    find(query);
  }

  function openSearch() {
    setSearch((value) => value ?? "");
    window.setTimeout(() => searchInput.current?.select());
  }

  function closeSearch() {
    setSearch(null);
    setMatches({ current: 0, total: 0 });
    find("");
  }

  // --- Ferramentas do pdf.js ---

  function setParam(type: number, value: unknown) {
    engine.current?.bus.dispatch("switchannotationeditorparams", { source: null, type, value });
  }

  function action(name: "undo" | "redo" | "delete") {
    engine.current?.bus.dispatch("editingaction", { source: null, name });
  }

  function choose(next: Tool, editId?: string) {
    if (!engine.current) return;
    if (next === "comment" && selection) { commentOnSelection(); return; }
    engine.current.viewer.annotationEditorMode = { mode: MODES[next], editId };
    setTool(next);
    // Ao abrir um item já existente, a cor e o tamanho da barra não podem ser aplicados a ele.
    if (editId) return;
    if (isColorTool(next)) setParam(COLOR_PARAM[next], colors[next]);
    if (isSizeTool(next)) setParam(SIZE_PARAM[next].param, sizes[next]);
    if (next === "ink") setParam(Param.INK_OPACITY, inkOpacity);
  }

  function changeColor(value: string) {
    if (!isColorTool(tool)) return;
    setColors((list) => ({ ...list, [tool]: value }));
    setParam(COLOR_PARAM[tool], value);
  }

  function changeOpacity(value: number) {
    setInkOpacity(value);
    if (tool === "ink") setParam(Param.INK_OPACITY, value);
  }

  function changeSize(value: number) {
    if (!isSizeTool(tool)) return;
    setSizes((list) => ({ ...list, [tool]: value }));
    setParam(SIZE_PARAM[tool].param, value);
  }

  function addImage(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    choose("image");
    // A camada de edição só fica pronta depois da troca de modo.
    window.setTimeout(() => {
      // O pdf.js põe cada imagem nova no centro da parte visível da página; com várias, elas descem em cascata para não ficarem empilhadas.
      const layer = pageElement(pages.current, engine.current?.viewer.currentPageNumber ?? page)?.querySelector<HTMLElement>(".annotationEditorLayer");
      const rect = layer?.getBoundingClientRect();
      const turned = Number(layer?.getAttribute("data-main-rotation") ?? 0) % 180 !== 0;
      files.forEach((bitmapFile, index) => {
        if (!rect) { setParam(Param.CREATE, { bitmapFile }); return; }
        const centerX = (Math.max(0, rect.left) + Math.min(window.innerWidth, rect.right)) / 2 - rect.left + index * 28;
        const centerY = (Math.max(0, rect.top) + Math.min(window.innerHeight, rect.bottom)) / 2 - rect.top + index * 28;
        const [x, y] = turned ? [centerY, centerX] : [centerX, centerY];
        setParam(Param.CREATE, { bitmapFile, x, y });
      });
    }, 100);
  }

  // --- Seleção: itens, texto e retângulo ---

  // Itens (imagem, desenho, caixa de texto) que tocam a área, do menor para o maior.
  function objectsIn(area: Area) {
    return Array.from(pages.current?.querySelectorAll<HTMLElement>(OBJECTS) ?? []).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (!overlaps(area, rect) || element.style.display === "none") return [];
      const kind = OBJECT_KINDS.find(([kindName]) => element.classList.contains(`${kindName}Editor`) || element.classList.contains(`${kindName}Annotation`));
      const editId = element.dataset.annotationId ?? element.id;
      return kind && editId ? [{ tool: kind[1], editId, area: rect.width * rect.height }] : [];
    }).sort((first, second) => first.area - second.area);
  }

  // Com itens sobrepostos, fica o menor (um desenho grande não esconde a imagem em cima dele).
  const objectAt = (x: number, y: number) => objectsIn({ left: x, top: y, right: x, bottom: y })[0] ?? null;

  // Abre o primeiro item na ferramenta dele e junta os outros à seleção, como um Shift+clique em cada um.
  function selectObjects(area: Area) {
    const found = objectsIn(area);
    if (!found.length) return false;
    clearSelection();
    choose(found[0].tool, found[0].editId);
    // A troca de modo do pdf.js é assíncrona: os itens ficam clicáveis um instante depois.
    window.setTimeout(() => {
      for (const editor of pages.current?.querySelectorAll<HTMLElement>(EDITORS) ?? []) {
        const rect = editor.getBoundingClientRect();
        if (editor.classList.contains("selectedEditor") || !overlaps(area, rect)) continue;
        const init = { bubbles: true, button: 0, shiftKey: true, isPrimary: true, pointerId: 1, pointerType: "mouse", clientX: rect.left + 1, clientY: rect.top + 1 };
        editor.dispatchEvent(new PointerEvent("pointerdown", init));
        editor.dispatchEvent(new PointerEvent("pointerup", init));
      }
    }, 150);
    return true;
  }

  // Arrasto iniciado fora de uma caixa de texto: seleciona os spans cobertos pela faixa.
  function selectTextIn(area: Area, end: { x: number; y: number }) {
    const spans = Array.from(pages.current?.querySelectorAll<HTMLElement>(".textLayer span") ?? []).filter((span) => {
      if (!span.firstChild || span.firstChild.nodeType !== Node.TEXT_NODE) return false;
      const rect = span.getBoundingClientRect();
      return rect.width > 0 && overlaps(area, rect);
    });
    if (!spans.length) { clearSelection(); return; }
    const range = document.createRange();
    range.setStart(spans[0].firstChild!, 0);
    const last = spans.at(-1)!.firstChild!;
    const caret = document.caretPositionFromPoint?.(end.x, end.y);
    range.setEnd(last, caret?.offsetNode === last ? caret.offset : last.textContent?.length ?? 0);
    const selected = window.getSelection();
    selected?.removeAllRanges();
    selected?.addRange(range);
    captureSelection(end);
  }

  // Arrastar a partir de um ponto vazio da página desenha um retângulo, como no Acrobat.
  function startMarquee(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const pageNode = target.closest<HTMLElement>(PAGE_SELECTOR);
    if (!pageNode || target.closest(".textLayer span, .annotationLayer :is(a, input, textarea, select, button)")) return false;
    event.preventDefault();
    const start = { x: event.clientX, y: event.clientY };
    dragStart.current = { ...start, page: pageNumberOf(pageNode) };
    const areaOf = (x: number, y: number) => ({ left: Math.min(start.x, x), top: Math.min(start.y, y), right: Math.max(start.x, x), bottom: Math.max(start.y, y) });
    const move = (moveEvent: globalThis.MouseEvent) => {
      const area = areaOf(moveEvent.clientX, moveEvent.clientY);
      setMarquee({ left: area.left, top: area.top, width: area.right - area.left, height: area.bottom - area.top });
    };
    const up = (upEvent: globalThis.MouseEvent) => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      setMarquee(null);
      if (Math.hypot(upEvent.clientX - start.x, upEvent.clientY - start.y) < 5) { clearSelection(); return; }
      const area = areaOf(upEvent.clientX, upEvent.clientY);
      // Mantém seleção por faixa ao começar no fundo da página; no texto, o browser usa a seleção nativa.
      if (!(editMode && selectObjects(area))) selectTextIn(area, { x: upEvent.clientX, y: upEvent.clientY });
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return true;
  }

  // Usa a seleção do próprio navegador (arrasto, duplo clique, toque, teclado) e só lê dela as caixas do realce.
  function captureSelection(end?: { x: number; y: number }) {
    const selected = window.getSelection();
    if (!container.current || !selected || selected.isCollapsed || !selected.rangeCount || !selected.toString().trim()) { setSelection(null); return; }
    const range = selected.getRangeAt(0).cloneRange();
    if (end) includeLettersUnderPointer(selected, range, dragStart.current ? [dragStart.current, end] : [end]);
    const startNode = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
    const target = startNode?.closest<HTMLElement>(PAGE_SELECTOR);
    if (!target || !container.current.contains(target)) { setSelection(null); return; }
    const { boxes, lastRect } = selectionBoxes(range, target);
    if (!boxes.length || !lastRect) { setSelection(null); return; }
    const viewport = container.current.getBoundingClientRect();
    setSelection({
      page: pageNumberOf(target), x: boxes[0].left, y: boxes[0].top, text: "", quote: selected.toString().replace(/\s+/g, " ").trim(), boxes,
      left: Math.min(lastRect.right, window.innerWidth - 160),
      top: Math.max(8, lastRect.top - 44),
      barLeft: Math.min(lastRect.right, viewport.right - 56) - viewport.left + container.current.scrollLeft,
      barTop: Math.max(lastRect.top - 44, viewport.top + 8) - viewport.top + container.current.scrollTop,
    });
  }

  function clearSelection() {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  // --- Modo de edição e edição de texto ---

  function enterEditMode() {
    setEditMode(true);
    if (window.matchMedia("(min-width: 1024px)").matches) setRightPanel("controls");
  }

  function leaveEditMode() {
    if (textEditor && textInput.current) commitTextEdit(textInput.current.value);
    choose("select");
    clearSelection();
    setEditMode(false);
    setRightPanel((value) => value === "controls" ? null : value);
  }

  // Abre a caixa de edição sobre a linha, com o tamanho, a fonte e as cores dela.
  function openTextEditor(edit: TextEdit) {
    const viewport = container.current;
    const pageNode = pageElement(pages.current, edit.page);
    if (!viewport || !pageNode) return;
    const box = viewBoxOf(edit, rotation);
    if (box.angle) { toast.error("Para editar o texto, deixe a página na posição normal (sem giro)."); return; }
    const rect = pageArea(pageNode);
    const area = placeOnPage(rect, scrollOrigin(viewport), box);
    clearSelection();
    setTextEditor({ edit, left: area.left, top: area.top, width: area.right - area.left, height: area.bottom - area.top, fontPx: box.font * rect.height });
  }

  // Acha, no conteúdo que o pdf.js leu, o trecho clicado: posição exata, tamanho, fonte e cores.
  async function startTextEdit(span: HTMLElement) {
    if (!pdf) return;
    if (locked) { toast.error("Este PDF é protegido contra edição. O texto não pode ser alterado."); return; }
    const pageNode = span.closest<HTMLElement>(PAGE_SELECTOR);
    const original = span.textContent ?? "";
    if (!pageNode || !original.trim()) return;
    const pageNumber = pageNumberOf(pageNode);
    const { page: proxy, content } = await pageText(pdf, pageNumber);
    const area = pageArea(pageNode);
    const rect = span.getBoundingClientRect();
    const place = { view: Array.from(proxy.view), pageRotate: proxy.rotate };
    const found = nearestLine(content.items, original, place, rotation, (fx, fy) => Math.hypot(area.left + fx * area.width - (rect.left + rect.right) / 2, area.top + fy * area.height - (rect.top + rect.bottom) / 2));
    if (!found) { toast.error("Esse trecho não pode ser editado (texto inclinado ou em formato especial)."); return; }
    const existing = textEdits.find((edit) => edit.page === pageNumber && Math.abs(edit.x - found.x) < 0.5 && Math.abs(edit.y - found.y) < 0.5);
    if (existing) { openTextEditor(existing); return; }
    const font = (proxy.commonObjs.has(found.fontName) ? proxy.commonObjs.get(found.fontName) : null) as { name?: string; bold?: boolean; black?: boolean; italic?: boolean } | null;
    const canvas = pageNode.querySelector("canvas");
    openTextEditor({
      id: crypto.randomUUID(), page: pageNumber, x: found.x, y: found.y, width: found.width, size: found.size, text: original, original,
      ...fontStyleOf(font?.name ?? "", content.styles[found.fontName]?.fontFamily ?? "", font),
      ...(canvas ? sampleColors(canvas, rect) : { color: "#000000", background: "#ffffff" }),
      ...place, pending: true,
    });
  }

  // Confirma a edição. Voltar ao texto original desfaz; deixar vazio apaga a linha.
  function commitTextEdit(value: string) {
    if (!textEditor) return;
    const { edit } = textEditor;
    setTextEditor(null);
    const existing = textEdits.find((entry) => entry.id === edit.id);
    if (value === edit.original) {
      if (existing) { setTextEdits((list) => list.filter((entry) => entry.id !== edit.id)); setTextDirty(true); }
      return;
    }
    if (existing?.text === value) return;
    setTextEdits((list) => existing ? list.map((entry) => entry.id === edit.id ? { ...entry, text: value } : entry) : [...list, { ...edit, text: value }]);
    setTextDirty(true);
  }

  // --- Realces e comentários ---

  function blockedByLock() {
    if (locked) toast.error(LOCKED_MESSAGE);
    return locked;
  }

  // Realces e comentários que já vêm no arquivo são desenhados no próprio canvas pelo pdf.js; esconder o elemento não basta.
  // Saem do desenho pela lista de ids modificados e, marcados como apagados no armazenamento do pdf.js, também do arquivo ao salvar.
  function eraseFromCanvas(entry: { id: string; page: number; popupRef?: string }) {
    if (!pdf || !isRefId(entry.id)) return;
    // O prefixo identifica para o pdf.js as alterações feitas pelo editor (AnnotationEditorPrefix).
    erasedIds.current.add(entry.id);
    pdf.annotationStorage.setValue(`pdfjs_internal_editor_removed_${entry.id}`, { id: entry.id, popupRef: entry.popupRef, pageIndex: entry.page - 1, deleted: true });
    engine.current?.viewer.refresh();
  }

  // Realce do visualizador sob o ponto (o mais recente primeiro), para clicar e selecionar.
  function highlightAt(x: number, y: number) {
    const viewport = container.current;
    if (!viewport) return null;
    const origin = scrollOrigin(viewport);
    const ids = new Set(plainHighlights.filter((entry) => !entry.removed).map((entry) => entry.id));
    return highlightBoxes.findLast((box) => ids.has(box.id) && containsPoint(box, x - origin.left, y - origin.top))?.id ?? null;
  }

  // Realce feito com a ferramenta Realçar do pdf.js: abre na ferramenta dele, que já traz cor e exclusão.
  function nativeHighlightAt(x: number, y: number) {
    return Array.from(pages.current?.querySelectorAll<HTMLElement>(".annotationEditorLayer .highlightEditor") ?? []).findLast((element) => containsPoint(element.getBoundingClientRect(), x, y))?.id ?? null;
  }

  // Tira o realce; o que já está no arquivo sai do desenho e fica marcado para sair do arquivo ao salvar.
  function dropHighlight(id: string) {
    const target = plainHighlights.find((entry) => entry.id === id);
    if (!target) return false;
    if (target.source) {
      if (blockedByLock()) return false;
      eraseFromCanvas(target);
    }
    setPlainHighlights((list) => removeFrom(list, id, (entry) => !!entry.source || !entry.pending));
    return true;
  }

  function deleteHighlight(id: string) {
    if (dropHighlight(id)) setSelectedHighlight(null);
  }

  function recolorHighlight(id: string, color: string) {
    const target = plainHighlights.find((entry) => entry.id === id);
    if (!target) return;
    setColors((list) => ({ ...list, highlight: color }));
    if (!target.source) {
      setPlainHighlights((list) => list.map((entry) => entry.id === id ? { ...entry, color, pending: true } : entry));
      return;
    }
    // O realce do arquivo é desenhado pelo pdf.js: sai do desenho e entra um novo, igual, na cor escolhida.
    if (blockedByLock()) return;
    eraseFromCanvas(target);
    const replacement: PlainHighlight = { id: crypto.randomUUID(), page: target.page, boxes: target.boxes, color, pending: true };
    setPlainHighlights((list) => [...list.map((entry) => entry.id === id ? { ...entry, removed: true, removedSaved: false } : entry), replacement]);
    setSelectedHighlight(replacement.id);
  }

  function removeHighlightFromMenu() {
    const id = contextMenu?.highlightId;
    if (id && plainHighlights.some((entry) => entry.id === id) && !dropHighlight(id)) { setContextMenu(null); return; }
    if (nativeHighlight.current) {
      nativeHighlight.current.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
      action("delete");
    }
    nativeHighlight.current = null;
    setContextMenu(null);
    clearSelection();
  }

  function highlightSelection(anchor: CommentDraft | null) {
    if (!anchor?.boxes?.length) return;
    if (blockedByLock()) { setContextMenu(null); return; }
    setPlainHighlights((list) => [...list, { id: crypto.randomUUID(), page: anchor.page, boxes: anchor.boxes!, color: colors.highlight, pending: true }]);
    setContextMenu(null);
    clearSelection();
  }

  // O novo comentário é escrito num cartão no painel da direita, como no Google Docs.
  function openDraft(anchor: CommentDraft) {
    setContextMenu(null);
    if (blockedByLock()) return;
    setDraft(anchor);
    setRightPanel("comments");
  }

  function commentOnSelection() {
    if (!selection) return;
    openDraft({ page: selection.page, x: selection.x, y: selection.y, text: "", quote: selection.quote, boxes: selection.boxes });
    clearSelection();
  }

  function placeComment(event: MouseEvent<HTMLDivElement>) {
    if (tool !== "comment" || !pdf) return;
    if (dragStart.current && Math.hypot(event.clientX - dragStart.current.x, event.clientY - dragStart.current.y) > 4) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(PAGE_SELECTOR);
    if (!target || !container.current?.contains(target)) return;
    if (selection) { commentOnSelection(); return; }
    const rect = pageArea(target);
    openDraft({ page: pageNumberOf(target), x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height, text: "" });
  }

  function openContextMenu(event: MouseEvent<HTMLDivElement>) {
    if (!pdf || isNarrow()) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(PAGE_SELECTOR);
    if (!target || !container.current?.contains(target)) return;
    event.preventDefault();
    const rect = pageArea(target);
    const pageNumber = pageNumberOf(target);
    const selected = selection?.page === pageNumber ? selection : null;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const highlight = plainHighlights.findLast((entry) => entry.page === pageNumber && !entry.removed && entry.boxes.some((box) => containsPoint(box, x, y)));
    nativeHighlight.current = (event.target as HTMLElement).closest<HTMLElement>(".annotationEditorLayer .highlightEditor");
    setContextMenu({
      left: Math.min(event.clientX, window.innerWidth - 220),
      top: Math.max(8, Math.min(event.clientY, window.innerHeight - (selected ? 270 : 190))),
      anchor: selected ?? { page: pageNumber, x, y, text: "" },
      highlightId: highlight?.id,
      nativeHighlight: !!nativeHighlight.current,
    });
  }

  function focusComment(comment: Comment) {
    setActiveComment(comment.id);
    if (window.matchMedia("(min-width: 768px)").matches) {
      setRightPanel("comments");
      requestAnimationFrame(() => document.getElementById(`comment-${comment.id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    } else setOpenComment(comment.id);
    goTo(comment.page);
    requestAnimationFrame(() => {
      const viewport = container.current;
      const pageNode = pageElement(pages.current, comment.page);
      if (!viewport || !pageNode) return;
      const viewportRect = viewport.getBoundingClientRect();
      const rect = pageArea(pageNode);
      viewport.scrollTo({
        left: viewport.scrollLeft + rect.left - viewportRect.left + comment.x * rect.width - viewport.clientWidth / 2,
        top: viewport.scrollTop + rect.top - viewportRect.top + comment.y * rect.height - viewport.clientHeight / 2,
        behavior: "smooth",
      });
    });
  }

  // Ação de comentário no arquivo do Drive; erros aparecem sem mudar a tela. Sem Drive, o comentário vai no próximo salvar.
  async function act(input: PdfCommentAction) {
    if (!sync) return true;
    setCommentBusy(true);
    try {
      await sync.act(input);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gravar o comentário.");
      return false;
    } finally {
      setCommentBusy(false);
    }
  }

  async function addComment() {
    if (!draft?.text.trim()) return;
    const id = crypto.randomUUID();
    const text = draft.text.trim();
    const sent = await act({ action: "add", id, page: draft.page, x: unit(draft.x), y: unit(draft.y), text, quote: draft.quote?.slice(0, 2000),
      boxes: draft.boxes?.slice(0, 200).map((box) => ({ left: unit(box.left), top: unit(box.top), right: unit(box.right), bottom: unit(box.bottom) })) });
    if (!sent) return;
    setComments((list) => [...list, { ...draft, id, text, highlighted: !!draft.boxes?.length, author: me, date: new Date().toISOString(), pending: !sync }]);
    setActiveComment(id);
    setDraft(null);
    choose("select");
  }

  async function replyTo(parentId: string, text: string) {
    const parent = comments.find((comment) => comment.id === parentId);
    if (!parent || blockedByLock()) return;
    const id = crypto.randomUUID();
    if (!await act({ action: "reply", id, parentId, text })) return;
    setReplies((list) => [...list, { id, parentId, page: parent.page, text, author: me, date: new Date().toISOString(), source: false, pending: !sync }]);
  }

  // Resolver grava a situação "Aceito" (padrão de revisão do PDF); aqui a conversa some, em outros leitores aparece como aceita.
  async function resolveComment(id: string) {
    if (blockedByLock()) return;
    if (!await act({ action: "resolve", id })) return;
    setComments((list) => list.map((comment) => comment.id === id ? { ...comment, resolved: true, resolvePending: !sync } : comment));
    setActiveComment(null);
    setOpenComment(null);
  }

  async function removeReply(id: string) {
    const reply = replies.find((entry) => entry.id === id);
    if (!reply) return;
    if (reply.source && blockedByLock()) return;
    if (!reply.pending && !await act({ action: "delete", id })) return;
    const done = !!sync && !reply.pending;
    setReplies((list) => reply.source || done ? list.map((entry) => entry.id === id ? { ...entry, removed: true, removedSaved: done } : entry) : list.filter((entry) => entry.id !== id));
  }

  async function removeComment(id: string) {
    const fromFile = sourceCommentIds.current.has(id);
    if (fromFile && blockedByLock()) return;
    const target = comments.find((comment) => comment.id === id);
    // No Drive, o que já foi gravado sai do arquivo na hora; o resto sai (ou fica marcado para sair) no próximo salvar.
    const removedNow = !!target && !target.pending && !!sync;
    if (removedNow && !await act({ action: "delete", id })) return;
    if (target && fromFile) eraseFromCanvas(target);
    setComments((list) => removedNow
      ? list.map((comment) => comment.id === id ? { ...comment, removed: true, removedSaved: true } : comment)
      : removeFrom(list, id, (comment) => fromFile || !comment.pending));
    setOpenComment(null);
    setActiveComment(null);
  }

  // Acerta comentários, respostas e resoluções com o que está no arquivo agora (ver reconcileThreads).
  function reconcile(notes: ParsedNote[]) {
    const next = reconcileThreads(notes, threadState.current);
    for (const comment of next.erased) if (sourceCommentIds.current.has(comment.id)) eraseFromCanvas(comment);
    setComments(next.comments);
    setReplies(next.replies);
  }

  // --- Arquivo: salvar, baixar, imprimir, páginas ---

  // O PDF com tudo o que foi feito na tela: o pdf.js grava as ferramentas dele; o resto é gravado aqui.
  async function edited() {
    if (!pdf) return source;
    const saved = await pdf.saveDocument();
    const changes = collectChanges({ comments, replies, highlights: plainHighlights, textEdits, sourceIds: sourceCommentIds.current });
    return pdfBlob(hasChangesToWrite(changes) ? await writeAnnotations(saved, changes, me) : saved);
  }

  // Leva junto o que já foi anotado e ainda não salvo.
  const editedBytes = async () => new Uint8Array(await (await edited()).arrayBuffer());

  async function organize() {
    if (!pdf) return;
    if (locked) { toast.error("Este PDF é protegido contra edição. As páginas não podem ser reorganizadas."); return; }
    setBusy(true);
    try {
      setOrganizing(await editedBytes());
    } catch {
      setError("Não foi possível preparar as páginas.");
    } finally {
      setBusy(false);
    }
  }

  function openPagination() {
    if (locked) { toast.error("Este PDF é protegido contra edição. O cabeçalho e o rodapé não podem ser gravados nele."); return; }
    setPaginating(true);
  }

  async function applyPagination(options: StampOptions) {
    setBusy(true);
    try {
      const result = await stampPages(await editedBytes(), options);
      setPaginating(false);
      applyOrganized(result);
    } catch {
      setError("Não foi possível aplicar o cabeçalho e o rodapé.");
    } finally {
      setBusy(false);
    }
  }

  function applyOrganized(result: Uint8Array) {
    setOrganizing(null);
    setPdf(undefined);
    setRebuilt({ from: file, blob: pdfBlob(result), unsaved: true });
  }

  async function save() {
    if (!onSave || !pdf) return;
    setBusy(true);
    setError("");
    try {
      const result = sync ? await sync.save(await edited()) : (await onSave(await edited()), null);
      pdf.annotationStorage.resetModified();
      if (result) {
        knownVersion.current = result.version;
        reconcile(await readNotes(result.bytes));
      }
      setRebuilt((value) => value && { ...value, unsaved: false });
      setTextDirty(false);
      setComments((list) => list.map((comment) => ({ ...markSaved(comment), resolvePending: false })));
      setReplies((list) => list.map(markSaved));
      setPlainHighlights((list) => list.map(markSaved));
    } catch (cause) {
      setError(cause instanceof Error && cause.name === "EncryptedPDFError" ? LOCKED_MESSAGE : cause instanceof Error ? cause.message : "Não foi possível salvar.");
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
      printBlob(await edited());
    } catch {
      setError("Não foi possível imprimir.");
    }
  }

  function shortcuts(event: KeyboardEvent) {
    if (event.key === "Escape" && selection) { clearSelection(); return; }
    if (selectedHighlight && (event.key === "Escape" || event.key === "Delete" || event.key === "Backspace") && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault();
      if (event.key === "Escape") setSelectedHighlight(null);
      else deleteHighlight(selectedHighlight);
      return;
    }
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();
    const run = { c: selection && (() => copy(selection.quote ?? "")), s: () => { if (hasChanges && onSave) void save(); }, f: openSearch, p: () => void print() }[key];
    if (!run) return;
    event.preventDefault();
    run();
  }

  // --- Ponteiro sobre as páginas ---

  function pointerDown(event: MouseEvent<HTMLDivElement>) {
    if (event.button === 0 && tool === "edittext") {
      const target = event.target as HTMLElement;
      const editedLine = target.closest<HTMLElement>("[data-text-edit]");
      const span = target.closest<HTMLElement>(".textLayer span:not(.markedContent)");
      if (target === textInput.current || (!editedLine && !span)) return;
      event.preventDefault();
      if (textEditor && textInput.current) commitTextEdit(textInput.current.value);
      const existing = editedLine && textEdits.find((entry) => entry.id === editedLine.dataset.textEdit);
      if (existing) openTextEditor(existing);
      else if (span) void startTextEdit(span);
      return;
    }
    if (event.button !== 0 || (tool !== "select" && tool !== "comment")) return;
    const object = tool === "select" && editMode ? objectAt(event.clientX, event.clientY) : null;
    if (object) { event.preventDefault(); clearSelection(); choose(object.tool, object.editId); return; }
    if (tool === "select" && startMarquee(event)) return;
    const pageNode = (event.target as HTMLElement).closest<HTMLElement>(PAGE_SELECTOR);
    dragStart.current = pageNode ? { x: event.clientX, y: event.clientY, page: pageNumberOf(pageNode) } : null;
  }

  function pointerUp(event: MouseEvent<HTMLDivElement>) {
    if (tool !== "select" && tool !== "comment" || marquee || event.button !== 0) return;
    const end = { x: event.clientX, y: event.clientY };
    const start = dragStart.current;
    requestAnimationFrame(() => {
      captureSelection(end);
      if (tool !== "select") return;
      const moved = !!start && Math.hypot(end.x - start.x, end.y - start.y) > 4;
      if (moved || window.getSelection()?.isCollapsed === false) { setSelectedHighlight(null); return; }
      const hit = highlightAt(end.x, end.y);
      setSelectedHighlight(hit);
      if (hit) return;
      const native = nativeHighlightAt(end.x, end.y);
      if (native) choose("highlight", native);
    });
  }

  const color = isColorTool(tool) ? colors[tool] : null;
  const size = isSizeTool(tool) ? { value: sizes[tool], ...SIZE_PARAM[tool] } : null;
  // Quem pode salvar o arquivo é o dono: resolve e apaga qualquer comentário; os demais só apagam o que ainda não foi salvo.
  const canModerate = !!onSave;
  const commentsById = new Map(comments.map((comment) => [comment.id, comment]));
  const textEditsById = new Map(textEdits.map((edit) => [edit.id, edit]));
  const threads: Thread[] = comments.filter((comment) => !comment.removed && !comment.resolved).sort((first, second) => first.page - second.page || first.y - second.y).map((comment) => ({
    id: comment.id, page: comment.page, quote: comment.quote, text: comment.text, authorName: comment.author, createdAt: comment.date, pending: comment.pending,
    canReply: true, canResolve: canModerate, canDelete: canModerate || !!comment.pending || !!sync && comment.author === me,
    replies: replies.filter((reply) => reply.parentId === comment.id && !reply.removed).map((reply) => ({ id: reply.id, text: reply.text, authorName: reply.author, createdAt: reply.date, pending: reply.pending, canDelete: canModerate || reply.pending || !!sync && reply.author === me })),
  }));
  const selectedBoxes = selectedHighlight ? highlightBoxes.filter((box) => box.id === selectedHighlight) : [];
  const selectedColor = plainHighlights.find((entry) => entry.id === selectedHighlight)?.color ?? DEFAULT_HIGHLIGHT;
  const openCommentEntry = openComment ? commentsById.get(openComment) : undefined;
  const openCommentMarker = openComment ? markers.find((entry) => entry.id === openComment) : undefined;
  // Rótulos das ferramentas só quando cabem numa linha: na leitura são poucas; na edição, muitas.
  const toolLabel = editMode ? "hidden @8xl/pdf:inline" : "hidden @6xl/pdf:inline";
  const controlsOpen = editMode && rightPanel === "controls";
  // O que recolhe no menu "⋯" quando falta espaço. Com o título do arquivo na barra, recolhe antes, para o nome caber.
  const collapse = leading ? "@max-5xl/pdf:hidden" : "@max-xl/pdf:hidden";
  const moreOnly = leading ? "@5xl/pdf:hidden" : "@xl/pdf:hidden";
  const status = busy ? "Salvando…" : hasChanges ? "Alterações não salvas" : "";
  const sizeLabel = tool === "ink" ? "Espessura" : "Tamanho do texto";
  const textStyle = (edit: TextEdit, fontPx: number): CSSProperties => ({ fontSize: fontPx, fontFamily: FAMILY_CSS[edit.family], fontWeight: edit.bold ? 700 : 400, fontStyle: edit.italic ? "italic" : "normal", color: edit.color });

  return (
    <div ref={root} tabIndex={-1} onKeyDown={shortcuts} className={`@container/pdf flex min-h-0 flex-1 flex-col overflow-hidden bg-card outline-none ${leading ? "" : "rounded-lg border"}`}>
      {organizing && <PdfOrganizer bytes={organizing} name={name} onCancel={() => setOrganizing(null)} onApply={applyOrganized} />}
      <div role="toolbar" aria-label="Ferramentas do PDF" className={`flex flex-wrap items-center gap-1 border-b p-1.5 md:flex-nowrap ${organizing ? "hidden" : ""}`}>
        {/* Voltar e o nome do arquivo; no celular ficam numa linha própria, acima das ferramentas. Do tablet para cima tudo
            fica numa linha só: o nome encolhe (com reticências) antes de algum botão descer. */}
        {leading && <div className="flex min-w-0 items-center gap-2 max-md:basis-full md:flex-initial @6xl/pdf:max-w-md">{leading}<span className="mx-1 h-5 w-px shrink-0 bg-border max-md:hidden" /></div>}
        {/* Em tela estreita (celular), tudo numa linha: ferramentas, página, Mais (⋯), Editar e Salvar. */}
        <div className="flex min-w-0 flex-wrap items-center gap-1 md:shrink-0 md:flex-nowrap">
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 max-md:hidden" aria-label="Miniaturas" title="Miniaturas" aria-pressed={sidebar} onClick={() => setSidebar((value) => !value)}><RiSidebarFoldLine /></Button>
          <span className="mx-1 h-5 w-px bg-border max-md:hidden" />
          {/* Na leitura ficam Selecionar, Realçar e Comentário, como no Word; o resto aparece ao editar. */}
          {TOOLS.filter(({ tool: entry }) => editMode || entry === "select" || entry === "highlight").map(({ tool: entry, label, icon: Icon }) => (
            <Button key={entry} type="button" variant={tool === entry ? "secondary" : "ghost"} size="sm" aria-label={label} aria-pressed={tool === entry} title={label} disabled={!pdf} onClick={() => choose(entry)}>
              <Icon className="size-4" /><span className={toolLabel}>{label}</span>
            </Button>
          ))}
          <Button type="button" variant={tool === "comment" ? "secondary" : "ghost"} size="sm" className="hidden md:inline-flex" aria-label="Adicionar comentário" title="Adicionar comentário" aria-pressed={tool === "comment"} disabled={!pdf} onClick={() => choose("comment")}><RiChat1Line className="size-4" /><span className={toolLabel}>Comentário</span></Button>
          {editMode && <>
            <Button type="button" variant={tool === "image" ? "secondary" : "ghost"} size="sm" title="Imagem ou assinatura" disabled={!pdf} onClick={() => picker.current?.click()}>
              <RiImageAddLine className="size-4" /><span className={toolLabel}>Imagem</span>
            </Button>
            <input ref={picker} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={addImage} />
            <Button type="button" variant="ghost" size="sm" className={collapse} title="Organizar páginas: ordem, girar, excluir, inserir e extrair" disabled={!pdf || busy} onClick={() => void organize()}><RiLayoutGridLine className="size-4" /><span className={toolLabel}>Organizar</span></Button>
            <Button type="button" variant="ghost" size="sm" className={collapse} title="Cabeçalho e rodapé: textos, logo, número de página e marca-d'água" disabled={!pdf || busy} onClick={openPagination}><RiLayoutTopLine className="size-4" /><span className={toolLabel}>Cabeçalho e rodapé</span></Button>
          </>}
          {color && !controlsOpen && <input type="color" aria-label="Cor" title="Cor" value={color} onChange={(event) => changeColor(event.target.value)} className="size-7 shrink-0 cursor-pointer rounded border bg-transparent p-0.5" />}
          {size && !controlsOpen && <input type="range" aria-label={sizeLabel} title={sizeLabel} min={size.min} max={size.max} value={size.value} onChange={(event) => changeSize(Number(event.target.value))} className="w-20 accent-primary" />}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {editMode && !controlsOpen && <>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!pdf} onClick={() => action("undo")}><RiArrowGoBackLine /></Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Refazer" title="Refazer (Ctrl+Y)" disabled={!pdf} onClick={() => action("redo")}><RiArrowGoForwardLine /></Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Excluir anotação" title="Excluir anotação selecionada (Del)" disabled={!pdf} onClick={() => action("delete")}><RiDeleteBinLine /></Button>
            <span className="mx-1 h-5 w-px bg-border max-md:hidden" />
          </>}
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Reduzir" title="Reduzir" className="@max-4xl/pdf:hidden" disabled={!pdf} onClick={() => setScale(zoom / 100 - 0.1)}><RiSubtractLine /></Button>
          <PdfZoomInput zoom={zoom} disabled={!pdf} className={collapse} onScale={setScale} onZoom={zoomTo} />
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Ampliar" title="Ampliar" className="@max-4xl/pdf:hidden" disabled={!pdf} onClick={() => setScale(zoom / 100 + 0.1)}><RiAddLine /></Button>
          {!autoZoom && <Button type="button" variant="ghost" size="icon-sm" className={collapse} aria-label="Voltar ao zoom automático" title="Voltar ao zoom automático (página inteira)" disabled={!pdf} onClick={() => zoomTo(defaultZoom())}><RiExpandWidthLine /></Button>}
          <Popover>
            <PopoverTrigger render={<Button type="button" variant={spread ? "secondary" : "ghost"} size="icon-sm" className={collapse} aria-label="Exibição de páginas" title="Exibição de páginas" disabled={!pdf} />}>{spread ? <RiBookOpenLine /> : <RiFileLine />}</PopoverTrigger>
            <PopoverContent className="w-60 p-1">
              <ViewMenuItems spread={spread} onZoom={zoomTo} onSpread={changeSpread} />
            </PopoverContent>
          </Popover>
          <Button type="button" variant="ghost" size="icon-sm" className={collapse} aria-label="Girar páginas" title="Girar páginas" disabled={!pdf} onClick={rotate}><RiClockwiseLine /></Button>
          <span className="mx-1 h-5 w-px bg-border max-md:hidden" />
          <span className="flex items-center gap-1 text-xs tabular-nums">
            <Input aria-label="Página" key={page} defaultValue={page} className="h-7 w-11 px-1 text-center text-xs" onKeyDown={(event) => { if (event.key === "Enter") goTo(Number(event.currentTarget.value)); }} />
            / {pdf?.numPages ?? "–"}
          </span>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {status && <span role="status" className={`px-1 text-xs text-muted-foreground ${collapse}`}>{status}</span>}
          <Button type="button" variant="ghost" size="icon-sm" className={collapse} aria-label="Localizar" title="Localizar (Ctrl+F)" disabled={!pdf} onClick={openSearch}><RiSearchLine /></Button>
          <Button type="button" variant="ghost" size="icon-sm" className={collapse} aria-label="Imprimir" title="Imprimir (Ctrl+P)" disabled={!pdf} onClick={() => void print()}><RiPrinterLine /></Button>
          <Button type="button" variant="ghost" size="sm" className={collapse} disabled={!pdf} onClick={() => void download()}><RiDownloadLine className="size-4" /><span className="hidden @7xl/pdf:inline">Baixar</span></Button>
          <Button type="button" variant={commentPanel ? "secondary" : "ghost"} size="icon-sm" className="hidden md:inline-flex" aria-label="Mostrar comentários" title="Mostrar comentários" aria-pressed={commentPanel} onClick={() => setRightPanel((value) => value === "comments" ? null : "comments")}><RiChat1Line /></Button>
          {editMode && <Button type="button" variant={rightPanel === "controls" ? "secondary" : "ghost"} size="icon-sm" className="hidden md:inline-flex" aria-label="Painel de controles" title="Painel de controles" aria-pressed={rightPanel === "controls"} onClick={() => setRightPanel((value) => value === "controls" ? null : "controls")}><RiEqualizerLine /></Button>}
          <Popover>
            <PopoverTrigger render={<Button type="button" variant="ghost" size="icon-sm" className={moreOnly} aria-label="Mais opções" title="Mais opções" disabled={!pdf} />}><RiMoreLine /></PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="text-sm">Zoom</span>
                <span className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Reduzir" onClick={() => setScale(zoom / 100 - 0.1)}><RiSubtractLine /></Button>
                  <span className="w-11 text-center text-xs tabular-nums">{zoom}%</span>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Ampliar" onClick={() => setScale(zoom / 100 + 0.1)}><RiAddLine /></Button>
                </span>
              </div>
              <ViewMenuItems spread={spread} onZoom={zoomTo} onSpread={changeSpread} />
              <MenuItem icon={<RiClockwiseLine className="size-4" />} onClick={rotate}>Girar páginas</MenuItem>
              <MenuSeparator />
              <MenuItem icon={<RiSearchLine className="size-4" />} onClick={openSearch}>Localizar</MenuItem>
              <MenuItem icon={<RiPrinterLine className="size-4" />} onClick={() => void print()}>Imprimir</MenuItem>
              <MenuItem icon={<RiDownloadLine className="size-4" />} onClick={() => void download()}>Baixar</MenuItem>
              {editMode && <>
                <MenuSeparator />
                <MenuItem icon={<RiLayoutGridLine className="size-4" />} disabled={busy} onClick={() => void organize()}>Organizar páginas</MenuItem>
                <MenuItem icon={<RiLayoutTopLine className="size-4" />} disabled={busy} onClick={openPagination}>Cabeçalho e rodapé</MenuItem>
              </>}
            </PopoverContent>
          </Popover>
          {editMode
            ? <Button type="button" variant="secondary" size="sm" title="Voltar à leitura" disabled={!pdf} onClick={leaveEditMode}><RiCheckLine className="size-4" />Concluir</Button>
            : <Button type="button" variant="outline" size="sm" title="Editar o PDF: texto, desenho, realce, imagens, páginas, cabeçalho e rodapé" disabled={!pdf} onClick={enterEditMode}><RiEditLine className="size-4" />Editar</Button>}
          {onSave && <Button type="button" size="sm" aria-label="Salvar" title={status || "Salvar"} disabled={!pdf || busy || !hasChanges} onClick={() => void save()}><RiSaveLine className="size-4" /><span className={collapse}>Salvar</span></Button>}
        </span>
      </div>
      {search !== null && !organizing && <PdfSearchBar query={search} matches={matches} inputRef={searchInput} onChange={findText} onFind={(previous) => find(search, true, previous)} onClose={closeSearch} />}
      <ErrorToast message={error} />
      <PdfPaginationDialog open={paginating} name={name} pageCount={pdf?.numPages ?? 1} busy={busy} onOpenChange={setPaginating} onApply={(options) => void applyPagination(options)} />
      {marquee && <div aria-hidden className="pointer-events-none fixed z-30 border border-primary bg-primary/10" style={marquee} />}
      {!pdf && !error && <LoadingBlock label="Abrindo PDF" className="p-6" />}
      <div className={`flex min-h-0 flex-1 ${organizing ? "hidden" : pdf ? "" : "invisible h-0 flex-none"}`}>
        {sidebar && pdf && <PdfThumbnails pdf={pdf} rotation={rotation} page={page} onSelect={goTo} />}
        <div className="relative min-w-0 flex-1 bg-muted/60">
          {/* O visualizador exige um contêiner com posição absoluta. */}
          <div ref={container} onClick={placeComment} onContextMenu={openContextMenu}
            onPointerDownCapture={(event) => {
              // No modo imagem, o pdf.js abre a escolha de arquivo a cada clique fora de uma imagem; aqui esse clique volta a Selecionar.
              if (tool !== "image" || event.button !== 0 || (event.target as HTMLElement).closest(".stampEditor, .editToolbar")) return;
              event.stopPropagation();
              choose("select");
            }}
            onMouseDown={pointerDown}
            onMouseUp={pointerUp}
            onTouchEnd={() => { if (tool === "select" || tool === "comment") window.setTimeout(() => captureSelection(), 300); }}
            onKeyUp={() => requestAnimationFrame(() => captureSelection())}
            className={`absolute inset-0 overflow-auto ${tool === "comment" ? "cursor-crosshair" : ""} ${tool === "edittext" ? "pdf-edit-text" : ""}`} style={{ touchAction: "pan-x pan-y" }}>
            <div ref={pages} className="pdfViewer" />
            <div className="pointer-events-none absolute top-0 left-0" aria-label="Marcadores de comentários">
              {editOverlays.map((overlay) => {
                const entry = textEditsById.get(overlay.id);
                if (!entry || textEditor?.edit.id === entry.id) return null;
                return <span key={overlay.id} data-text-edit={entry.id} title={tool === "edittext" ? "Clique para editar" : undefined} className={`absolute ${tool === "edittext" ? "pointer-events-auto cursor-text hover:outline-1 hover:outline-primary hover:outline-dashed" : ""}`} style={{ left: overlay.left, top: overlay.top, width: overlay.width, height: overlay.height, background: entry.background }}>
                  <span className="absolute top-1/2 left-1/2 leading-none whitespace-pre" style={{ ...textStyle(entry, overlay.fontPx), width: overlay.angle % 180 ? overlay.height : overlay.width, paddingLeft: overlay.fontPx * 0.08, transform: `translate(-50%, -50%) rotate(${overlay.angle}deg)` }}>{entry.text}</span>
                </span>;
              })}
              {highlightBoxes.map((box, index) => box.paint && <span key={`${box.id}-${index}`} className="absolute mix-blend-multiply" style={{ left: box.left, top: box.top, width: box.right - box.left, height: box.bottom - box.top, background: box.color ?? DEFAULT_HIGHLIGHT, opacity: 0.7 }} />)}
              {selectedHighlight && selectedBoxes.length > 0 && <>
                {selectedBoxes.map((box, index) => <span key={`outline-${index}`} className="absolute rounded-xs outline-2 outline-offset-1 outline-primary outline-dashed" style={{ left: box.left, top: box.top, width: box.right - box.left, height: box.bottom - box.top }} />)}
                <div role="toolbar" aria-label="Realce selecionado" onMouseDown={(event) => { event.stopPropagation(); event.preventDefault(); }} onMouseUp={(event) => event.stopPropagation()}
                  className="pointer-events-auto absolute z-30 flex items-center gap-1 rounded-full border bg-card p-1 shadow-lg"
                  style={{ left: Math.min(...selectedBoxes.map((box) => box.left)), top: Math.max(...selectedBoxes.map((box) => box.bottom)) + 8 }}>
                  {HIGHLIGHT_COLORS.map((swatch) => <button key={swatch} type="button" aria-label={`Cor ${swatch}`} title="Mudar a cor" onClick={() => recolorHighlight(selectedHighlight, swatch)} className={`size-6 rounded-full border shadow-sm ${selectedColor.toLowerCase() === swatch ? "ring-2 ring-primary ring-offset-1" : ""}`} style={{ background: swatch }} />)}
                  <span className="mx-0.5 h-5 w-px bg-border" />
                  <button type="button" onClick={() => deleteHighlight(selectedHighlight)} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs hover:bg-muted"><RiDeleteBinLine className="size-3.5" />Remover</button>
                </div>
              </>}
              {markers.map((marker) => {
                const comment = commentsById.get(marker.id);
                return comment && <button key={marker.id} type="button" aria-label={`Comentário ${marker.index} na página ${comment.page}`} title={comment.text} onClick={() => focusComment(comment)} style={{ left: marker.left, top: marker.top }} className={`pointer-events-auto absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-white bg-amber-400 text-amber-950 shadow-md ${activeComment === marker.id ? "ring-2 ring-primary" : ""}`}><RiChat1Line className="size-3.5" /></button>;
              })}
            </div>
            {textEditor && <input ref={textInput} autoFocus aria-label="Editar texto do PDF" defaultValue={textEditor.edit.text}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") { event.preventDefault(); commitTextEdit(event.currentTarget.value); }
                else if (event.key === "Escape") { event.preventDefault(); setTextEditor(null); }
              }}
              onBlur={(event) => commitTextEdit(event.currentTarget.value)}
              className="absolute z-30 border-0 p-0 outline-2 outline-offset-2 outline-primary"
              style={{ ...textStyle(textEditor.edit, textEditor.fontPx), left: textEditor.left, top: textEditor.top, height: textEditor.height, minWidth: textEditor.width, fieldSizing: "content", paddingLeft: textEditor.fontPx * 0.08, lineHeight: 1, background: textEditor.edit.background } as CSSProperties} />}
            {openCommentEntry && openCommentMarker && <div role="dialog" aria-label={`Comentário na página ${openCommentEntry.page}`} style={{ left: Math.max(8, Math.min(openCommentMarker.left + 20, contentWidth - 328)), top: Math.max(8, openCommentMarker.top + 18) }} className="absolute z-40 w-80 max-w-full rounded border border-amber-300 bg-amber-100 p-3 text-sm text-amber-950 shadow-xl md:hidden">
              <div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium">Página {openCommentEntry.page}</span><button type="button" aria-label="Fechar comentário" onClick={() => setOpenComment(null)} className="rounded px-1 hover:bg-amber-200">×</button></div>
              {openCommentEntry.quote && <blockquote className="mb-2 border-l-2 border-amber-500 pl-2 text-xs">{openCommentEntry.quote}</blockquote>}
              <p className="wrap-break-word whitespace-pre-wrap">{openCommentEntry.text}</p>
              <button type="button" onClick={() => void removeComment(openCommentEntry.id)} className="mt-3 flex items-center gap-1 rounded px-1 py-0.5 text-xs text-destructive hover:bg-amber-200"><RiDeleteBinLine className="size-3.5" />Excluir comentário</button>
            </div>}
            {selection && <PdfSelectionBar left={selection.barLeft} top={selection.barTop}
              onCopy={() => { copy(selection.quote ?? ""); clearSelection(); }}
              onFind={() => { const query = selection.quote ?? ""; clearSelection(); findText(query); }}
              onHighlight={() => highlightSelection(selection)}
              onComment={commentOnSelection}
              onMore={() => setContextMenu({ left: Math.min(selection.left + 40, window.innerWidth - 220), top: Math.min(selection.top, window.innerHeight - 270), anchor: selection })} />}
          </div>
          {contextMenu && <PdfContextMenu menu={contextMenu} editMode={editMode} spread={spread} onClose={() => setContextMenu(null)}
            onRemoveHighlight={removeHighlightFromMenu}
            onHighlight={() => highlightSelection(contextMenu.anchor)}
            onComment={() => { openDraft(contextMenu.anchor); clearSelection(); }}
            onCopy={copy}
            onFind={findText}
            onFitWidth={() => zoomTo("page-width")}
            onOrganize={() => void organize()}
            onPagination={openPagination}
            onEdit={enterEditMode}
            onSpread={changeSpread}
            onRotate={rotate}
            onPrint={() => void print()} />}
        </div>
        {rightPanel && <aside aria-label="Painel do PDF" className="hidden w-72 shrink-0 overflow-y-auto border-l bg-card md:block">
          <div role="tablist" aria-label="Painel" className="sticky top-0 z-10 flex border-b bg-card">
            {([["controls", "Controles"], ["comments", "Comentários"]] as const).filter(([key]) => editMode || key === "comments").map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={rightPanel === key} onClick={() => setRightPanel(key)} className="flex-1 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground aria-selected:border-primary aria-selected:text-foreground">{label}</button>)}
          </div>
          {rightPanel === "controls" && editMode ? <PdfControlsPanel
            tool={tool}
            onTool={(next) => { if (next === "image") picker.current?.click(); else choose(next); }}
            color={color}
            onColor={changeColor}
            size={size && { value: size.value, min: size.min, max: size.max, label: tool === "ink" ? "Espessura" : "Tamanho", unit: tool === "ink" ? "px" : "pt" }}
            onSize={changeSize}
            opacity={tool === "ink" ? inkOpacity : null}
            onOpacity={changeOpacity}
            zoom={zoom}
            onZoom={(percent) => setScale(percent / 100)}
            onFitWidth={() => zoomTo("page-width")}
            onRotate={rotate}
            spread={spread}
            spreads={SPREADS}
            onSpread={changeSpread}
            onAction={action}
            onOrganize={() => void organize()}
            onHeaderFooter={openPagination}
            onSearch={openSearch}
            onPrint={() => void print()}
            onDownload={() => void download()}
            disabled={!pdf || busy}
          /> : <PdfCommentsPanel
            threads={threads}
            activeId={activeComment}
            draft={draft && { page: draft.page, quote: draft.quote, text: draft.text }}
            busy={busy || commentBusy}
            emptyHint="Selecione um trecho e clique em Comentar, ou use Comentário e clique num ponto do PDF."
            onFocus={(id) => { const comment = commentsById.get(id); if (comment) focusComment(comment); }}
            onResolve={(id) => void resolveComment(id)}
            onDelete={(id) => { if (commentsById.has(id)) void removeComment(id); else void removeReply(id); }}
            onReply={replyTo}
            onDraftChange={(text) => setDraft((value) => value && { ...value, text })}
            onDraftSubmit={() => void addComment()}
            onDraftCancel={() => setDraft(null)}
          />}
        </aside>}
      </div>
    </div>
  );
}
