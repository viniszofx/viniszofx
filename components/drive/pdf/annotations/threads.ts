import { boxesFromQuads, isoFromPdfDate, numbersOf, refId, textOf } from "./mod";
import { PDFDict, PDFDocument, PDFName, PDFObjectCopier, PDFRef } from "pdf-lib";

// Conversas de comentários lidas direto do PDF (padrão de anotações), para sincronizar sem recarregar o arquivo.
export type ParsedNote = {
  refId: string | null;
  nm?: string;
  page: number;
  subtype: string;
  text: string;
  author?: string;
  date?: string;
  inReplyTo: string | null;
  state?: string;
  stateModel?: string;
  x: number;
  y: number;
  rect: number[];
  boxes?: { left: number; top: number; right: number; bottom: number }[];
};

export async function readNotes(bytes: Uint8Array): Promise<ParsedNote[]> {
  const document = await PDFDocument.load(bytes, { updateMetadata: false });
  const notes: ParsedNote[] = [];
  document.getPages().forEach((page, index) => {
    const annotations = page.node.Annots();
    if (!annotations) return;
    const { width, height } = page.getSize();
    for (const entry of annotations.asArray()) {
      const dict = document.context.lookupMaybe(entry, PDFDict);
      const subtype = dict?.get(PDFName.of("Subtype"))?.toString().slice(1);
      if (!dict || (subtype !== "Text" && subtype !== "Highlight")) continue;
      const rect = numbersOf(dict.get(PDFName.of("Rect")));
      const boxes = boxesFromQuads(numbersOf(dict.get(PDFName.of("QuadPoints"))), width, height);
      const irt = dict.get(PDFName.of("IRT"));
      notes.push({
        refId: entry instanceof PDFRef ? refId(entry) : null,
        nm: textOf(dict.get(PDFName.of("NM"))),
        page: index + 1,
        subtype,
        text: textOf(dict.get(PDFName.of("Contents"))) ?? "",
        author: textOf(dict.get(PDFName.of("T"))),
        date: isoFromPdfDate(textOf(dict.get(PDFName.of("M"))) ?? textOf(dict.get(PDFName.of("CreationDate")))),
        inReplyTo: irt instanceof PDFRef ? refId(irt) : null,
        state: textOf(dict.get(PDFName.of("State"))),
        stateModel: textOf(dict.get(PDFName.of("StateModel"))),
        x: (rect[subtype === "Highlight" ? 2 : 0] ?? 0) / width,
        y: 1 - (rect[3] ?? 0) / height,
        rect,
        boxes: boxes.length ? boxes : undefined,
      });
    }
  });
  return notes;
}

// Chave estável de uma anotação entre versões: o nome único (/NM) quando houver, senão a referência do objeto.
function keyed(document: PDFDocument) {
  const found = new Map<string, { page: number; index: number; entry: unknown }>();
  document.getPages().forEach((page, pageIndex) => {
    page.node.Annots()?.asArray().forEach((entry, index) => {
      const dict = document.context.lookupMaybe(entry, PDFDict);
      const nm = dict && textOf(dict.get(PDFName.of("NM")));
      const key = nm ? `nm:${nm}` : entry instanceof PDFRef ? `ref:${entry.objectNumber} ${entry.generationNumber}` : null;
      if (key) found.set(key, { page: pageIndex, index, entry });
    });
  });
  return found;
}

// Junção de três vias, como no git, só com anotações. Sobre a versão de quem salva (ours) entram as diferenças que os
// outros fizeram desde a base (a versão que foi aberta) até a atual (theirs): o que acrescentaram entra, o que apagaram
// sai. Sem conflitos: se os dois lados mexeram na mesma anotação, vale a de quem salva. "own" são as anotações que quem
// salva já enviou antes, que não contam como novidade dos outros.
export async function mergeAnnotations(base: Uint8Array, ours: Uint8Array, theirs: Uint8Array, previous: Set<string>): Promise<{ bytes: Uint8Array; own: Set<string>; changed: boolean }> {
  const [baseDoc, oursDoc, theirsDoc] = await Promise.all([base, ours, theirs].map((bytes) => PDFDocument.load(bytes, { updateMetadata: false })));
  const baseKeys = keyed(baseDoc);
  const oursKeys = keyed(oursDoc);
  const theirsKeys = keyed(theirsDoc);
  // O que quem salva acrescentou (e não o que veio dos outros) conta como "dele" na próxima junção.
  const own = new Set([...oursKeys.keys()].filter((key) => !baseKeys.has(key)));
  const removed = [...baseKeys.keys()].filter((key) => !theirsKeys.has(key) && oursKeys.has(key));
  const added = [...theirsKeys.entries()].filter(([key]) => !baseKeys.has(key) && !oursKeys.has(key) && !previous.has(key));
  const pages = oursDoc.getPages();
  // Remove de trás para frente em cada página, para os índices não mudarem no meio.
  const byPage = new Map<number, number[]>();
  for (const key of removed) {
    const spot = oursKeys.get(key)!;
    byPage.set(spot.page, [...(byPage.get(spot.page) ?? []), spot.index]);
  }
  for (const [page, indexes] of byPage) {
    const annotations = pages[page]?.node.Annots();
    for (const index of indexes.sort((first, second) => second - first)) annotations?.remove(index);
  }
  const copier = PDFObjectCopier.for(theirsDoc.context, oursDoc.context);
  for (const [, spot] of added) {
    const dict = theirsDoc.context.lookupMaybe(spot.entry as PDFRef, PDFDict);
    // Sem a referência à página antiga, a cópia não arrasta a página (e o documento) junto.
    dict?.delete(PDFName.of("P"));
    const copied = copier.copy(spot.entry as PDFRef);
    pages[Math.min(spot.page, pages.length - 1)]?.node.addAnnot(copied instanceof PDFRef ? copied : oursDoc.context.register(copied));
  }
  const bytes = await oursDoc.save({ updateFieldAppearances: false });
  return { bytes, own, changed: removed.length + added.length > 0 };
}
