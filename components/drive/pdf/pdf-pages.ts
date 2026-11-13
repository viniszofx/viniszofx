import type { PDFDocumentProxy } from "pdfjs-dist";
import { degrees, PDFArray, PDFDict, PDFDocument as EditablePdf, type PDFPage, PDFRef, PDFStream } from "pdf-lib";

// Página na ordem montada: de qual arquivo vem (0 é o PDF aberto; -1 é página em branco), qual página dele e quanto girar.
export type Entry = { key: string; source: number; index: number; rotation: number; size?: [number, number] };
export type Source = { pdf: PDFDocumentProxy; bytes: Uint8Array };

export const normalize = (angle: number) => ((angle % 360) + 360) % 360;

// Tira do arquivo os objetos que nenhuma página ou o catálogo usam mais (páginas excluídas), para o PDF não ficar com o peso delas.
function dropUnreachable(document: EditablePdf) {
  const { context } = document;
  const seen = new Set<PDFRef>();
  const pending: unknown[] = [context.trailerInfo.Root, context.trailerInfo.Info, context.trailerInfo.Encrypt];
  while (pending.length) {
    const value = pending.pop();
    if (value instanceof PDFRef) {
      if (seen.has(value)) continue;
      seen.add(value);
      pending.push(context.lookup(value));
    } else if (value instanceof PDFDict) {
      for (const [, entry] of value.entries()) pending.push(entry);
    } else if (value instanceof PDFArray) {
      pending.push(...value.asArray());
    } else if (value instanceof PDFStream) {
      pending.push(value.dict);
    }
  }
  for (const [ref] of context.enumerateIndirectObjects()) if (!seen.has(ref)) context.delete(ref);
}

// Monta o PDF na ordem pedida. As páginas do arquivo aberto são movidas no próprio documento, o que mantém
// formulários, metadados e marcadores; as de outros PDFs são copiadas uma vez por arquivo.
export async function buildPdf(sources: Source[], entries: Entry[]) {
  const document = await EditablePdf.load(sources[0].bytes);
  const original = document.getPages();
  const copies = new Map<string, PDFPage>();
  for (const source of new Set(entries.filter((entry) => entry.source > 0).map((entry) => entry.source))) {
    const other = await EditablePdf.load(sources[source].bytes);
    const list = entries.filter((entry) => entry.source === source);
    const pages = await document.copyPages(other, list.map((entry) => entry.index));
    list.forEach((entry, position) => copies.set(entry.key, pages[position]));
  }
  const order = [...original];
  const wanted = entries.map((entry) => {
    if (entry.source === 0) return original[entry.index];
    const page = entry.source < 0 ? document.addPage(entry.size) : document.addPage(copies.get(entry.key)!);
    order.push(page);
    return page;
  });
  wanted.forEach((page, position) => {
    const { rotation } = entries[position];
    if (rotation) page.setRotation(degrees(normalize(page.getRotation().angle + rotation)));
  });
  wanted.forEach((page, target) => {
    const current = order.indexOf(page);
    if (current === target) return;
    document.removePage(current);
    order.splice(current, 1);
    document.insertPage(target, page);
    order.splice(target, 0, page);
  });
  for (let index = order.length - 1; index >= wanted.length; index--) document.removePage(index);
  dropUnreachable(document);
  return document.save({ updateFieldAppearances: false });
}
