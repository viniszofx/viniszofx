"use client";

// Hidden iframe with every page of a DOCX painted by the editor engine. Shared by
// printing (browser dialog) and the PDF download, so both match the editor exactly.
import { DOCUMENT_FONTS } from "./document-fonts";
import { paintDocxPages, type PaintedFace, type PaintedPage } from "./docx-pages";

const PAGE_CSS = `
  html, body { margin: 0; padding: 0; background: #fff; }
  #pages { position: static !important; width: auto !important; height: auto !important; }
  #pages > .docx-page { position: relative !important; left: 0 !important; top: 0 !important; margin: 0 !important; box-shadow: none !important; overflow: hidden; break-after: page; }
  #pages > .docx-page:last-child { break-after: auto; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

/** The editor stylesheet already loaded by the app (rules for .docx-page and friends). */
function editorCss() {
  let css = "";
  for (const sheet of document.styleSheets) {
    try {
      const rules = [...sheet.cssRules].map(rule => rule.cssText);
      if (rules.some(rule => rule.includes(".docx-page"))) css += rules.join("\n");
    } catch { /* cross-origin sheet: not ours */ }
  }
  return css;
}

export type DocxFrame = { window: Window; document: Document; pages: PaintedPage[]; pageElements: HTMLElement[]; faces: PaintedFace[]; dispose: () => void };

export async function openDocxFrame(file: Blob, title: string): Promise<DocxFrame> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  // Off-screen but laid out at full size, so measurements match the printed sheet.
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1200px;height:1600px;border:0";
  document.body.append(frame);
  const dispose = () => setTimeout(() => frame.remove(), 1000);
  try {
    const doc = frame.contentDocument!;
    doc.open(); doc.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title></title></head><body><div id="pages"></div></body></html>`); doc.close();
    doc.title = title.replace(/\.docx$/i, "");
    const style = doc.createElement("style");
    style.textContent = editorCss() + PAGE_CSS;
    doc.head.append(style);
    const root = doc.getElementById("pages")!;
    const { pages, faces } = await paintDocxPages(new Uint8Array(await file.arrayBuffer()), root, DOCUMENT_FONTS);
    if (!pages.length) throw new Error("O documento não tem páginas.");
    // Sized to the document's own paper; otherwise the browser default (e.g. Letter) applies.
    style.textContent += `@page { size: ${pages[0].width}px ${pages[0].height}px; margin: 0; }`;
    await doc.fonts.ready;
    const pageElements = [...root.querySelectorAll<HTMLElement>(":scope > .docx-page")];
    return { window: frame.contentWindow!, document: doc, pages, pageElements, faces, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
