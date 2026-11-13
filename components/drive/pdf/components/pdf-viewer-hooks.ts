import { type RefObject, useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PdfCommentAction } from "../compat";
import { type ParsedNote, readNotes } from "../annotations/mod";

// Pinça com dois dedos amplia e reduz o PDF (entre 25% e 400%).
export function usePinchZoom(target: RefObject<HTMLElement | null>, scale: { get: () => number | undefined; set: (value: number) => void }) {
  const latest = useRef(scale);
  useEffect(() => { latest.current = scale; });
  useEffect(() => {
    const element = target.current;
    if (!element) return;
    let pinch: { distance: number; scale: number } | null = null;
    const distance = (touches: TouchList) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    const start = (event: TouchEvent) => {
      const current = latest.current.get();
      if (event.touches.length === 2 && current !== undefined) pinch = { distance: distance(event.touches), scale: current };
    };
    const move = (event: TouchEvent) => {
      if (event.touches.length !== 2 || !pinch) return;
      event.preventDefault();
      latest.current.set(pinch.scale * distance(event.touches) / pinch.distance);
    };
    const end = (event: TouchEvent) => { if (event.touches.length < 2) pinch = null; };
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("touchmove", move, { passive: false });
    element.addEventListener("touchend", end);
    element.addEventListener("touchcancel", end);
    return () => {
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", end);
      element.removeEventListener("touchcancel", end);
    };
  }, [target]);
}

// Fecha um menu flutuante ao clicar fora, rolar ou teclar.
export function useDismiss(open: boolean, close: () => void) {
  const latest = useRef(close);
  useEffect(() => { latest.current = close; });
  useEffect(() => {
    if (!open) return;
    const dismiss = () => latest.current();
    document.addEventListener("click", dismiss);
    document.addEventListener("scroll", dismiss, true);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("click", dismiss);
      document.removeEventListener("scroll", dismiss, true);
      document.removeEventListener("keydown", dismiss);
    };
  }, [open]);
}

// Arquivo do Drive: comentários vão direto ao servidor (gravados no próprio PDF), a tela acompanha a versão do arquivo
// para trazer os dos outros sem recarregar, e salvar junta as diferenças com a versão atual.
export type PdfSync = {
  initialVersion: () => string | null;
  act: (action: PdfCommentAction) => Promise<unknown>;
  version: () => Promise<string>;
  latest: () => Promise<Uint8Array>;
  save: (edited: Blob) => Promise<{ bytes: Uint8Array; version: string }>;
  // Nome de quem comenta, quando não vem da conta (o visitante do link público assina "Visitante").
  author?: string;
};

// Traz os comentários dos outros sem recarregar: confere a versão do arquivo de tempos em tempos e ao voltar para a aba.
export function useVersionSync(sync: PdfSync | undefined, pdf: PDFDocumentProxy | undefined, knownVersion: RefObject<string | null>, onNotes: (notes: ParsedNote[]) => void) {
  const latest = useRef(onNotes);
  useEffect(() => { latest.current = onNotes; });
  useEffect(() => {
    if (!sync || !pdf) return;
    knownVersion.current ??= sync.initialVersion();
    let running = false;
    const check = async () => {
      if (running || window.document.hidden) return;
      running = true;
      try {
        const version = await sync.version();
        if (version !== knownVersion.current) {
          const bytes = await sync.latest();
          knownVersion.current = version;
          latest.current(await readNotes(bytes));
        }
      } catch {
        // Sem conexão: tenta de novo na próxima vez.
      } finally {
        running = false;
      }
    };
    const timer = window.setInterval(() => void check(), 15000);
    const visible = () => { if (!window.document.hidden) void check(); };
    window.document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      window.document.removeEventListener("visibilitychange", visible);
    };
  }, [sync, pdf, knownVersion]);
}

export type ZoomPreset = "page-width" | "page-fit" | "auto";
export const isZoomPreset = (value?: string): value is ZoomPreset => value === "page-width" || value === "page-fit" || value === "auto";
// O PDF abre com a página inteira; no celular, na largura, para dar para ler.
export const defaultZoom = (): ZoomPreset => window.matchMedia("(max-width: 767px)").matches ? "page-width" : "page-fit";

// Exibição de páginas, como no Edge (valores do SpreadMode do pdf.js): uma, duas lado a lado, ou duas com a capa sozinha.
// A escolha fica guardada neste navegador para os próximos PDFs.
export const SPREADS: [number, string][] = [[0, "Uma página"], [1, "Duas páginas"], [2, "Duas páginas, capa separada"]];
const SPREAD_KEY = "pdf-spread";
export function readStoredSpread() {
  try { return Number(localStorage.getItem(SPREAD_KEY)) || 0; } catch { return 0; }
}
export function storeSpread(value: number) {
  try { localStorage.setItem(SPREAD_KEY, String(value)); } catch { /* sem armazenamento, vale só nesta tela */ }
}
