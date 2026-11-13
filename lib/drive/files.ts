import { createZip } from "./zip";
import { PDFDocument } from "pdf-lib";

export const DRIVE_FILE_LIMIT = 10 * 1024 * 1024;
export const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const PDF_TYPE = "application/pdf";

export const FOLDER_COLORS = {
  blue: { label: "Azul", shades: ["#6db8f2", "#3f93e0"] },
  green: { label: "Verde", shades: ["#7dd38a", "#4bb35f"] },
  yellow: { label: "Amarelo", shades: ["#f7d65c", "#e8b92e"] },
  orange: { label: "Laranja", shades: ["#f8b15e", "#ee8f32"] },
  red: { label: "Vermelho", shades: ["#f28a84", "#e25d55"] },
  purple: { label: "Roxo", shades: ["#b79af0", "#9270dc"] },
  pink: { label: "Rosa", shades: ["#f49ac2", "#e56fa4"] },
  gray: { label: "Cinza", shades: ["#b4bbc6", "#8f98a6"] },
} as const;
export type FolderColor = keyof typeof FOLDER_COLORS;

export const extension = (name: string) => name.includes(".") ? name.split(".").at(-1)!.toLowerCase() : "";
export const MEDIA: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif", bmp: "image/bmp", svg: "image/svg+xml",
  pdf: "application/pdf",
  mp4: "video/mp4", webm: "video/webm", mov: "video/mp4", m4v: "video/mp4",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4", aac: "audio/aac",
};
const TEXT = new Set(["txt", "md", "csv", "tsv", "json", "xml", "html", "htm", "css", "js", "ts", "tsx", "jsx", "sql", "log", "yaml", "yml", "ini", "py", "sh"]);
export type PreviewKind = "docx" | "sheet" | "pdf" | "image" | "video" | "audio" | "text" | "none";

export function previewKind(name: string): PreviewKind {
  const ext = extension(name);
  if (ext === "docx" || ext === "doc") return "docx";
  if (ext === "xlsx" || ext === "xls") return "sheet";
  if (TEXT.has(ext)) return "text";
  const media = MEDIA[ext];
  if (!media) return "none";
  return media.startsWith("image/") ? "image" : media === "application/pdf" ? "pdf" : media.startsWith("video/") ? "video" : "audio";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeName(name: string) {
  return name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/^[. ]+|[. ]+$/g, "") || "item";
}

export function uniqueName(name: string, used: Set<string>) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let candidate = name;
  for (let index = 2; used.has(candidate.toLocaleLowerCase("pt-BR")); index++) candidate = `${base} (${index})${ext}`;
  used.add(candidate.toLocaleLowerCase("pt-BR"));
  return candidate;
}

const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const relationships = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export function createDocx() {
  return createZip([
    { path: "[Content_Types].xml", data: `${xml}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>` },
    { path: "_rels/.rels", data: `${xml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationships}/officeDocument" Target="word/document.xml"/></Relationships>` },
    { path: "word/_rels/document.xml.rels", data: `${xml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationships}/styles" Target="styles.xml"/></Relationships>` },
    { path: "word/styles.xml", data: `${xml}<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>` },
    { path: "word/document.xml", data: `${xml}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>` },
  ], DOCX_TYPE);
}

export function createXlsx() {
  return createZip([
    { path: "[Content_Types].xml", data: `${xml}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>` },
    { path: "_rels/.rels", data: `${xml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationships}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { path: "xl/workbook.xml", data: `${xml}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${relationships}"><sheets><sheet name="Planilha 1" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { path: "xl/_rels/workbook.xml.rels", data: `${xml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationships}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>` },
    { path: "xl/worksheets/sheet1.xml", data: `${xml}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>` },
  ], XLSX_TYPE);
}

export async function createPdf() {
  const document = await PDFDocument.create();
  document.addPage([595.28, 841.89]);
  return new Blob([new Uint8Array(await document.save())], { type: PDF_TYPE });
}
