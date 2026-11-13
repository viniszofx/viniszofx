import fontkit from "@pdf-lib/fontkit";
import { degrees, PDFDocument, type PDFFont, rgb, StandardFonts } from "pdf-lib";

export type Slots = { left: string; center: string; right: string };
export type Logo = { bytes: Uint8Array; type: "png" | "jpg"; align: keyof Slots; heightMm: number };
export type Family = "helvetica" | "times" | "courier" | "custom";
export type Typography = { family: Family; bold: boolean; italic: boolean; custom: { bytes: Uint8Array; name: string } | null; color: string };
export type StampOptions = {
  typography: Typography;
  lineColor: string;
  watermarkColor: string;
  watermarkOpacity: number;
  header: Slots;
  logo: Logo | null;
  lines: boolean;
  footer: Slots;
  watermark: string;
  size: number;
  marginMm: number;
  firstNumber: number;
  fromPage: number;
  name: string;
};

const MM = 72 / 25.4;

// As três famílias que todo leitor de PDF tem, com negrito e itálico.
export const STANDARD: Record<Exclude<Family, "custom">, [StandardFonts, StandardFonts, StandardFonts, StandardFonts]> = {
  helvetica: [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique, StandardFonts.HelveticaBoldOblique],
  times: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic],
  courier: [StandardFonts.Courier, StandardFonts.CourierBold, StandardFonts.CourierOblique, StandardFonts.CourierBoldOblique],
};

export function hexColor(hex: string) {
  const value = Number.parseInt(hex.replace("#", ""), 16) || 0;
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

async function embedTypography(document: PDFDocument, typography: Typography) {
  if (typography.family === "custom" && typography.custom) {
    // Fonte enviada (TTF ou OTF): entra só com os caracteres usados e desenha qualquer acento ou símbolo que ela tenha.
    document.registerFontkit(fontkit);
    return document.embedFont(typography.custom.bytes, { subset: true });
  }
  const family = typography.family === "custom" ? "helvetica" : typography.family;
  return document.embedFont(STANDARD[family][(typography.bold ? 1 : 0) + (typography.italic ? 2 : 0)]);
}

// Troca as marcas pelo valor da página: {p} número, {t} último número, {data} hoje, {arquivo} nome do arquivo.
export function fillTokens(text: string, values: { page: number; total: number; name: string }) {
  return text
    .replaceAll("{p}", String(values.page))
    .replaceAll("{t}", String(values.total))
    .replaceAll("{data}", new Date().toLocaleDateString("pt-BR"))
    .replaceAll("{arquivo}", values.name.replace(/\.pdf$/i, ""));
}

// A fonte padrão do PDF só tem os caracteres do português e do inglês; o que ela não desenha vira "?".
export function printable(font: PDFFont, text: string) {
  return Array.from(text).map((char) => {
    try {
      font.encodeText(char);
      return char;
    } catch {
      return "?";
    }
  }).join("");
}

// Escreve cabeçalho, rodapé e marca-d'água em cada página, de pé em relação a como a página aparece (respeita o giro dela).
export async function stampPages(bytes: Uint8Array, options: StampOptions) {
  const document = await PDFDocument.load(bytes);
  const font = await embedTypography(document, options.typography);
  const pages = document.getPages();
  const from = Math.min(Math.max(1, options.fromPage), pages.length);
  const total = options.firstNumber + pages.length - from;
  const margin = options.marginMm * MM;
  const color = hexColor(options.typography.color);
  const logo = options.logo ? await (options.logo.type === "png" ? document.embedPng(options.logo.bytes) : document.embedJpg(options.logo.bytes)) : null;
  const logoHeight = logo && options.logo ? options.logo.heightMm * MM : 0;
  const logoWidth = logo ? logoHeight * (logo.width / logo.height) : 0;
  pages.forEach((page, index) => {
    if (index + 1 < from) return;
    const values = { page: options.firstNumber + index + 1 - from, total, name: options.name };
    const box = page.getCropBox();
    const angle = ((page.getRotation().angle % 360) + 360) % 360;
    const [width, height] = angle % 180 ? [box.height, box.width] : [box.width, box.height];
    // Converte um ponto de como a página é vista para as coordenadas do arquivo.
    const toPage = (x: number, y: number) => {
      if (angle === 90) return { x: box.x + box.width - y, y: box.y + x };
      if (angle === 180) return { x: box.x + box.width - x, y: box.y + box.height - y };
      if (angle === 270) return { x: box.x + y, y: box.y + box.height - x };
      return { x: box.x + x, y: box.y + y };
    };
    const xFor = (align: keyof Slots, itemWidth: number) => align === "left" ? margin : align === "right" ? width - margin - itemWidth : (width - itemWidth) / 2;
    const write = (raw: string, align: keyof Slots, baseline: number) => {
      const text = printable(font, fillTokens(raw, values)).trim();
      if (!text) return;
      page.drawText(text, { ...toPage(xFor(align, font.widthOfTextAtSize(text, options.size)), baseline), size: options.size, font, color, rotate: degrees(angle) });
    };
    // Com logo, os textos do cabeçalho ficam centralizados na altura dela.
    const headerTop = height - margin;
    const headerBaseline = logo ? headerTop - logoHeight / 2 - options.size * 0.35 : headerTop - options.size * 0.8;
    const headerBottom = logo ? headerTop - logoHeight : headerTop - options.size;
    if (logo && options.logo) page.drawImage(logo, { ...toPage(xFor(options.logo.align, logoWidth), headerTop - logoHeight), width: logoWidth, height: logoHeight, rotate: degrees(angle) });
    for (const align of ["left", "center", "right"] as const) {
      if (!(logo && options.logo?.align === align)) write(options.header[align], align, headerBaseline);
      write(options.footer[align], align, margin);
    }
    if (options.lines) {
      const rule = (y: number) => page.drawLine({ start: toPage(margin, y), end: toPage(width - margin, y), thickness: 0.5, color: hexColor(options.lineColor) });
      if (logo || Object.values(options.header).some((text) => text.trim())) rule(headerBottom - 5);
      if (Object.values(options.footer).some((text) => text.trim())) rule(margin + options.size + 4);
    }
    const mark = printable(font, fillTokens(options.watermark, values)).trim();
    if (mark) {
      // Na diagonal, ocupando cerca de 70% da diagonal da página.
      const diagonal = Math.hypot(width, height);
      const size = Math.min(120, (diagonal * 0.7) / Math.max(1, font.widthOfTextAtSize(mark, 1)));
      const markWidth = font.widthOfTextAtSize(mark, size);
      const tilt = Math.atan2(height, width);
      const x = width / 2 - (Math.cos(tilt) * markWidth) / 2 + (Math.sin(tilt) * size * 0.35);
      const y = height / 2 - (Math.sin(tilt) * markWidth) / 2 - (Math.cos(tilt) * size * 0.35);
      page.drawText(mark, { ...toPage(x, y), size, font, color: hexColor(options.watermarkColor), opacity: options.watermarkOpacity, rotate: degrees(angle + (tilt * 180) / Math.PI) });
    }
  });
  return document.save({ updateFieldAppearances: false });
}
