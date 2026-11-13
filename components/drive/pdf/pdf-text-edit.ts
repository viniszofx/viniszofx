import type { PDFDocument, PDFFont } from "pdf-lib";
import { normalize } from "./pdf-pages";
import { hexColor, printable, STANDARD } from "./pdf-stamp";

// Uma linha de texto do PDF editada: posição e tamanho no espaço do PDF (como o pdf.js leu), estilo detectado e cores da página.
export type TextEdit = {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  size: number;
  text: string;
  original: string;
  family: "helvetica" | "times" | "courier";
  bold: boolean;
  italic: boolean;
  color: string;
  background: string;
  view: number[];
  pageRotate: number;
  pending: boolean;
};

export const FAMILY_CSS: Record<TextEdit["family"], string> = {
  helvetica: "Helvetica, Arial, sans-serif",
  times: "'Times New Roman', Times, serif",
  courier: "'Courier New', Courier, monospace",
};

// Faixa coberta pela edição: da descida das letras até um pouco acima da altura delas.
export function coverOf(edit: Pick<TextEdit, "x" | "y" | "width" | "size">) {
  const pad = edit.size * 0.08;
  return { x: edit.x - pad, y: edit.y - edit.size * 0.28, width: edit.width + pad * 2, height: edit.size * 1.22 };
}



// Ponto do PDF -> fração da página como ela aparece (0 a 1, de cima para baixo), considerando o giro da página e o da tela.
export function toViewFraction(edit: Pick<TextEdit, "view" | "pageRotate">, viewRotation: number, x: number, y: number) {
  const [x0, y0, x1, y1] = edit.view;
  const fx = (x - x0) / (x1 - x0);
  const fy = 1 - (y - y0) / (y1 - y0);
  const angle = normalize(edit.pageRotate + viewRotation);
  if (angle === 90) return [1 - fy, fx];
  if (angle === 180) return [1 - fx, 1 - fy];
  if (angle === 270) return [fy, 1 - fx];
  return [fx, fy];
}

// Retângulo da faixa coberta em frações da página vista, tamanho da letra em fração da altura vista e giro do texto na tela.
export function viewBoxOf(edit: TextEdit, viewRotation: number) {
  const cover = coverOf(edit);
  const corners = [[cover.x, cover.y], [cover.x + cover.width, cover.y], [cover.x, cover.y + cover.height], [cover.x + cover.width, cover.y + cover.height]].map(([x, y]) => toViewFraction(edit, viewRotation, x, y));
  const angle = normalize(edit.pageRotate + viewRotation);
  const [x0, y0, x1, y1] = edit.view;
  const shownHeight = angle % 180 ? x1 - x0 : y1 - y0;
  return {
    left: Math.min(...corners.map(([x]) => x)),
    top: Math.min(...corners.map(([, y]) => y)),
    right: Math.max(...corners.map(([x]) => x)),
    bottom: Math.max(...corners.map(([, y]) => y)),
    font: edit.size / shownHeight,
    angle,
  };
}

type TextItem = { str: string; transform: number[]; width: number; fontName: string };
type TextLine = { x: number; y: number; width: number; size: number; fontName: string };

// Trecho do conteúdo da página com o texto clicado, o mais perto do ponto clicado (center, em frações da página vista).
// Só texto na horizontal e de pé.
export function nearestLine(items: readonly object[], text: string, place: Pick<TextEdit, "view" | "pageRotate">, viewRotation: number, distanceTo: (fx: number, fy: number) => number) {
  let best: TextLine | null = null;
  let nearest = Infinity;
  for (const item of items as TextItem[]) {
    if (!("str" in item) || item.str !== text) continue;
    const [a, b, c, d, x, y] = item.transform;
    if (Math.abs(b) > 0.01 || Math.abs(c) > 0.01 || a <= 0 || d <= 0) continue;
    const [fx, fy] = toViewFraction(place, viewRotation, x + item.width / 2, y + d * 0.35);
    const distance = distanceTo(fx, fy);
    if (distance < nearest) { nearest = distance; best = { x, y, width: item.width, size: d, fontName: item.fontName }; }
  }
  return best;
}

// Família padrão mais parecida e estilo, pelo nome da fonte do PDF e pela família que o pdf.js deduziu.
export function fontStyleOf(fontName: string, cssFamily: string, font: { bold?: boolean; black?: boolean; italic?: boolean } | null): Pick<TextEdit, "family" | "bold" | "italic"> {
  const family: TextEdit["family"] = /mono|courier|consol/i.test(`${fontName} ${cssFamily}`)
    ? "courier"
    : /times|georgia|garamond|cambria|book|serif/i.test(fontName) && !/sans/i.test(fontName) || /^serif$/i.test(cssFamily) ? "times" : "helvetica";
  return {
    family,
    bold: !!font?.bold || !!font?.black || /bold|black|heavy|semibold|demi/i.test(fontName),
    italic: !!font?.italic || /italic|oblique/i.test(fontName),
  };
}

const hex = (red: number, green: number, blue: number) => `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;

// Lê no desenho da página a cor de fundo (a mais comum em volta do trecho) e a cor do texto (a mais diferente do fundo dentro dele).
export function sampleColors(canvas: HTMLCanvasElement, area: DOMRect) {
  const fallback = { color: "#000000", background: "#ffffff" };
  const box = canvas.getBoundingClientRect();
  const context = canvas.getContext("2d");
  if (!context || !box.width) return fallback;
  const scaleX = canvas.width / box.width;
  const scaleY = canvas.height / box.height;
  const ring = 3;
  const left = Math.max(0, Math.floor((area.left - box.left) * scaleX) - ring);
  const top = Math.max(0, Math.floor((area.top - box.top) * scaleY) - ring);
  const right = Math.min(canvas.width, Math.ceil((area.right - box.left) * scaleX) + ring);
  const bottom = Math.min(canvas.height, Math.ceil((area.bottom - box.top) * scaleY) + ring);
  if (right <= left || bottom <= top) return fallback;
  let pixels: Uint8ClampedArray;
  try {
    pixels = context.getImageData(left, top, right - left, bottom - top).data;
  } catch {
    return fallback;
  }
  const width = right - left;
  const height = bottom - top;
  const counts = new Map<string, { count: number; rgb: [number, number, number] }>();
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      if (row >= ring && row < height - ring && column >= ring && column < width - ring) continue;
      const index = (row * width + column) * 4;
      const rgb: [number, number, number] = [pixels[index], pixels[index + 1], pixels[index + 2]];
      const key = rgb.map((value) => value >> 3).join(",");
      const entry = counts.get(key) ?? { count: 0, rgb };
      entry.count++;
      counts.set(key, entry);
    }
  }
  const background = [...counts.values()].sort((first, second) => second.count - first.count)[0]?.rgb ?? [255, 255, 255];
  let text: [number, number, number] = [0, 0, 0];
  let farthest = -1;
  for (let index = 0; index < pixels.length; index += 4) {
    const distance = Math.abs(pixels[index] - background[0]) + Math.abs(pixels[index + 1] - background[1]) + Math.abs(pixels[index + 2] - background[2]);
    if (distance > farthest) { farthest = distance; text = [pixels[index], pixels[index + 1], pixels[index + 2]]; }
  }
  return { color: farthest > 60 ? hex(...text) : "#000000", background: hex(...background) };
}

// Grava as edições: cobre o texto original com a cor do fundo e escreve o novo no mesmo lugar, com a fonte padrão mais parecida.
export async function applyTextEdits(document: PDFDocument, edits: TextEdit[]) {
  const fonts = new Map<string, PDFFont>();
  for (const edit of edits) {
    const key = `${edit.family}-${edit.bold}-${edit.italic}`;
    let font = fonts.get(key);
    if (!font) {
      font = await document.embedFont(STANDARD[edit.family][(edit.bold ? 1 : 0) + (edit.italic ? 2 : 0)]);
      fonts.set(key, font);
    }
    const page = document.getPage(edit.page - 1);
    page.drawRectangle({ ...coverOf(edit), color: hexColor(edit.background) });
    const text = printable(font, edit.text).replace(/\s+$/, "");
    if (text.trim()) page.drawText(text, { x: edit.x, y: edit.y, size: edit.size, font, color: hexColor(edit.color) });
  }
}
