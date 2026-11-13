import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

// O visualizador lê a biblioteca deste global ao ser importado.
(globalThis as unknown as { pdfjsLib: typeof pdfjs }).pdfjsLib = pdfjs;

// Fontes padrão e mapas de caracteres para PDFs que não embutem as próprias fontes; o service worker guarda em cache.
const ASSETS = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}`;
// The worker is bundled with the app (same installed version as the library).
pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export const loadPdfViewer = () => import("pdfjs-dist/web/pdf_viewer.mjs");

export function openPdf(data: Uint8Array) {
  return pdfjs.getDocument({
    data,
    standardFontDataUrl: `${ASSETS}/standard_fonts/`,
    cMapUrl: `${ASSETS}/cmaps/`,
    cMapPacked: true,
  });
}

export { pdfjs };
