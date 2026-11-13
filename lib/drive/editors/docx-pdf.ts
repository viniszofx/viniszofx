"use client";

// DOCX → PDF file in the browser. The editor engine paints every page (docx-frame.ts);
// this walks that DOM and writes a PDF with pdf-lib: real, searchable text with the exact
// embedded fonts, backgrounds, borders and images at their painted positions. Vector
// drawings (SVG) are embedded as high-resolution images.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { openDocxFrame, type DocxFrame } from "./docx-frame";
import type { PaintedFace } from "./docx-pages";

const PT = 0.75; // CSS px → PDF points
const RASTER_SCALE = 3; // SVG drawings rasterized at 3× (≈ 288 dpi)

type Color = { color: RGB; opacity: number };
type Box = { left: number; top: number; width: number; height: number };

function parseColor(value: string): Color | null {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b, a = "1"] = match[1].split(/[\s,/]+/).filter(Boolean);
  const opacity = Number(a);
  return opacity > 0 ? { color: rgb(Number(r) / 255, Number(g) / 255, Number(b) / 255), opacity } : null;
}

/** Embedded fonts by private alias, weight and style, with the ascent share used for baselines. */
class FontBook {
  private cache = new Map<string, Promise<{ font: PDFFont; ascent: number }>>();
  private fallback?: Promise<{ font: PDFFont; ascent: number }>;
  constructor(private pdf: PDFDocument, private faces: PaintedFace[]) {}

  get(style: CSSStyleDeclaration) {
    const families = style.fontFamily.split(",").map(name => name.trim().replace(/^["']|["']$/g, ""));
    const bold = Number(style.fontWeight) >= 600;
    const italic = style.fontStyle === "italic" || style.fontStyle === "oblique";
    for (const family of families) {
      const candidates = this.faces.filter(face => face.family === family);
      if (!candidates.length) continue;
      const face = candidates.find(entry => (entry.weight >= 600) === bold && (entry.style === "italic") === italic)
        ?? candidates.find(entry => (entry.weight >= 600) === bold) ?? candidates[0];
      const key = `${face.family}|${face.weight}|${face.style}`;
      if (!this.cache.has(key)) this.cache.set(key, this.embed(face));
      return this.cache.get(key)!;
    }
    this.fallback ??= this.pdf.embedFont(StandardFonts.Helvetica).then(font => ({ font, ascent: 0.77 }));
    return this.fallback;
  }

  private async embed(face: PaintedFace) {
    const parsed = fontkit.create(face.bytes) as unknown as { ascent: number; descent: number };
    const font = await this.pdf.embedFont(face.bytes, { subset: true });
    // Share of the content box above the baseline (the box a Range reports is ascent + descent).
    return { font, ascent: parsed.ascent / (parsed.ascent - parsed.descent) };
  }
}

function boxOf(element: Element | Range, page: DOMRect): Box {
  const rect = element.getBoundingClientRect();
  return { left: rect.left - page.left, top: rect.top - page.top, width: rect.width, height: rect.height };
}

const visible = (style: CSSStyleDeclaration) => style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;

function drawBoxes(element: HTMLElement, page: PDFPage, origin: DOMRect, height: number, view: Window) {
  for (const node of [element, ...element.querySelectorAll<HTMLElement>("*")]) {
    if (node instanceof SVGElement && !(node instanceof SVGSVGElement)) continue;
    const style = view.getComputedStyle(node);
    if (!visible(style)) continue;
    const box = boxOf(node, origin);
    if (box.width <= 0 || box.height <= 0) continue;
    const fill = node === element ? null : parseColor(style.backgroundColor);
    if (fill) page.drawRectangle({ x: box.left * PT, y: height - (box.top + box.height) * PT, width: box.width * PT, height: box.height * PT, color: fill.color, opacity: fill.opacity });
    const sides = [
      ["Top", box.left, box.top, box.left + box.width, box.top],
      ["Bottom", box.left, box.top + box.height, box.left + box.width, box.top + box.height],
      ["Left", box.left, box.top, box.left, box.top + box.height],
      ["Right", box.left + box.width, box.top, box.left + box.width, box.top + box.height],
    ] as const;
    for (const [side, x1, y1, x2, y2] of sides) {
      const width = parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`));
      const kind = style.getPropertyValue(`border-${side.toLowerCase()}-style`);
      const color = parseColor(style.getPropertyValue(`border-${side.toLowerCase()}-color`));
      if (!width || kind === "none" || kind === "hidden" || !color) continue;
      page.drawLine({ start: { x: x1 * PT, y: height - y1 * PT }, end: { x: x2 * PT, y: height - y2 * PT }, thickness: width * PT, color: color.color, opacity: color.opacity, dashArray: kind === "dashed" ? [3, 2] : kind === "dotted" ? [1, 1] : undefined });
    }
  }
}

async function rasterize(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * RASTER_SCALE));
  canvas.height = Math.max(1, Math.round(height * RASTER_SCALE));
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Uint8Array(await (await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("canvas")), "image/png"))).arrayBuffer());
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url; });
}

async function drawImages(element: HTMLElement, pdf: PDFDocument, page: PDFPage, origin: DOMRect, height: number, view: Window) {
  const place = (box: Box) => ({ x: box.left * PT, y: height - (box.top + box.height) * PT, width: box.width * PT, height: box.height * PT });
  for (const image of element.querySelectorAll("img")) {
    const box = boxOf(image, origin);
    if (!box.width || !box.height || !visible(view.getComputedStyle(image))) continue;
    try {
      const bytes = new Uint8Array(await (await fetch(image.currentSrc || image.src)).arrayBuffer());
      const png = bytes[0] === 0x89 && bytes[1] === 0x50, jpg = bytes[0] === 0xff && bytes[1] === 0xd8;
      const embedded = png ? await pdf.embedPng(bytes) : jpg ? await pdf.embedJpg(bytes) : await pdf.embedPng(await rasterize(image, box.width, box.height));
      page.drawImage(embedded, place(box));
    } catch { /* unreadable image: skipped rather than failing the whole export */ }
  }
  // Outermost SVGs only (drawings, shapes, charts); nested ones are part of them.
  for (const svg of element.querySelectorAll("svg")) {
    if (svg.parentElement?.closest("svg")) continue;
    const box = boxOf(svg, origin);
    if (!box.width || !box.height || !visible(view.getComputedStyle(svg))) continue;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(box.width)); clone.setAttribute("height", String(box.height));
    if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    try {
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
      try { page.drawImage(await pdf.embedPng(await rasterize(await loadImage(url), box.width, box.height)), place(box)); }
      finally { URL.revokeObjectURL(url); }
    } catch { /* drawing that can't be rasterized: skipped */ }
  }
}

async function drawText(element: HTMLElement, book: FontBook, page: PDFPage, origin: DOMRect, height: number, view: Window) {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const range = element.ownerDocument.createRange();
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const parent = node.parentElement;
    if (!parent || parent.closest("svg")) continue;
    const style = view.getComputedStyle(parent);
    const color = parseColor(style.color);
    if (!visible(style) || !color) continue;
    const { font, ascent } = await book.get(style);
    const size = parseFloat(style.fontSize);
    const decorations = style.textDecorationLine;
    // Word by word: each word lands where the browser laid it out, so justification,
    // tabs and spacing match without re-implementing line layout.
    for (const match of node.data.matchAll(/\S+/g)) {
      range.setStart(node, match.index!); range.setEnd(node, match.index! + match[0].length);
      const box = boxOf(range, origin);
      if (!box.width) continue;
      const baseline = box.top + box.height * ascent;
      let text = match[0];
      try { font.encodeText(text); } catch { text = text.replace(/[^\x20-\x7e -ÿ]/g, "?"); }
      page.drawText(text, { x: box.left * PT, y: height - baseline * PT, size: size * PT, font, color: color.color, opacity: color.opacity });
      for (const [line, offset] of [["underline", 0.12], ["line-through", -0.3]] as const) {
        if (!decorations.includes(line)) continue;
        const y = height - (baseline + size * offset) * PT;
        page.drawLine({ start: { x: box.left * PT, y }, end: { x: (box.left + box.width) * PT, y }, thickness: Math.max(0.5, size * 0.06 * PT), color: color.color });
      }
    }
  }
}

async function writePdf(frame: DocxFrame, title: string) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(title); pdf.setCreator("viniszofx"); pdf.setProducer("viniszofx (pdf-lib)");
  const book = new FontBook(pdf, frame.faces);
  for (const [index, element] of frame.pageElements.entries()) {
    const size = frame.pages[index] ?? frame.pages[0];
    const page = pdf.addPage([size.width * PT, size.height * PT]);
    const height = size.height * PT;
    const origin = element.getBoundingClientRect();
    drawBoxes(element, page, origin, height, frame.window);
    await drawImages(element, pdf, page, origin, height, frame.window);
    await drawText(element, book, page, origin, height, frame.window);
  }
  return pdf.save();
}

/** Builds the PDF of `file` (the current editor content) and returns it as a Blob. */
export async function docxToPdf(file: Blob, title: string) {
  const frame = await openDocxFrame(file, title);
  try {
    return new Blob([new Uint8Array(await writePdf(frame, title.replace(/\.docx$/i, "")))], { type: "application/pdf" });
  } finally {
    frame.dispose();
  }
}
