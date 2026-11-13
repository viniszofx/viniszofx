import { addAccepted, addComment, addReply, boundsOf, quadsOf, refFromId } from "./annotations/mod";
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRef } from "pdf-lib";
import type { Comment, PlainHighlight, Reply } from "./pdf-model";
import { applyTextEdits, type TextEdit } from "./pdf-text-edit";

// Grava no PDF salvo pelo pdf.js (com desenhos, textos e realces da ferramenta dele) o que o visualizador controla
// por conta própria: comentários, respostas, resoluções, realces da seleção, remoções e edições de texto.

export const DEFAULT_HIGHLIGHT = "#ffd940";

type Removal = { id: string; page: number; rect?: number[] };
export type AnnotationChanges = {
  comments: Comment[];
  replies: Reply[];
  resolutions: Comment[];
  highlights: PlainHighlight[];
  removals: Removal[];
  // Comentários que já estão no arquivo, para as respostas e resoluções novas apontarem para eles.
  anchors: Comment[];
  textEdits: TextEdit[];
};

export function collectChanges(state: { comments: Comment[]; replies: Reply[]; highlights: PlainHighlight[]; textEdits: TextEdit[]; sourceIds: Set<string> }): AnnotationChanges {
  const { comments, replies, highlights, textEdits, sourceIds } = state;
  const fromFile = (comment: Comment) => sourceIds.has(comment.id);
  const live = new Set(comments.filter((comment) => !comment.removed).map((comment) => comment.id));
  return {
    comments: comments.filter((comment) => !fromFile(comment) && !comment.removed && !comment.synced),
    replies: replies.filter((reply) => !reply.source && !reply.removed && !reply.synced && live.has(reply.parentId)),
    resolutions: comments.filter((comment) => comment.resolved && !comment.resolvedSource && !comment.removed),
    highlights: highlights.filter((highlight) => !highlight.source && !highlight.removed),
    removals: [
      ...highlights.filter((highlight) => highlight.source && highlight.removed),
      ...comments.filter((comment) => fromFile(comment) && comment.removed),
      ...replies.filter((reply) => reply.source && reply.removed),
    ],
    anchors: comments.filter((comment) => fromFile(comment) || comment.synced),
    textEdits,
  };
}

export const hasChangesToWrite = (changes: AnnotationChanges) =>
  [changes.comments, changes.replies, changes.resolutions, changes.highlights, changes.removals, changes.textEdits].some((list) => list.length > 0);

const rgbOf = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16) || 0;
  return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255];
};

// Encontra no arquivo a anotação que o pdf.js identificou: pela referência ("12R", "12R3") ou, se ela estiver escrita direto na página, pelo retângulo.
function sameAnnotation(entry: unknown, dict: PDFDict | undefined, id: string, rect?: number[]) {
  const ref = refFromId(id);
  if (ref) return entry instanceof PDFRef && entry.objectNumber === ref.objectNumber && entry.generationNumber === ref.generationNumber;
  const values = dict?.lookupMaybe(PDFName.of("Rect"), PDFArray)?.asArray().map((value) => value instanceof PDFNumber ? value.asNumber() : NaN);
  if (entry instanceof PDFRef || !rect || values?.length !== 4) return false;
  const normalize = ([x1, y1, x2, y2]: number[]) => [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
  const [a, b] = [normalize(values), normalize(rect)];
  return a.every((value, index) => Math.abs(value - b[index]) < 0.5);
}

// Tira a anotação da página com o balão (Popup), as respostas e as marcas de revisão (/IRT) ligadas a ela.
function remove(document: PDFDocument, removed: Removal) {
  const annotations = document.getPage(removed.page - 1).node.Annots();
  if (!annotations) return;
  const entries = annotations.asArray().map((entry) => ({ entry, dict: document.context.lookupMaybe(entry, PDFDict) }));
  const targets = new Set(entries.filter(({ entry, dict }) => sameAnnotation(entry, dict, removed.id, removed.rect)));
  const linked = new Set<unknown>();
  const popups = new Set<unknown>();
  for (const { entry, dict } of targets) {
    if (entry instanceof PDFRef) linked.add(entry);
    const popup = dict?.get(PDFName.of("Popup"));
    if (popup instanceof PDFRef) popups.add(popup);
  }
  for (let index = entries.length - 1; index >= 0; index--) {
    const { entry, dict } = entries[index];
    const parent = dict?.get(PDFName.of("Parent"));
    const inReplyTo = dict?.get(PDFName.of("IRT"));
    if (targets.has(entries[index]) || popups.has(entry) || linked.has(parent) || linked.has(inReplyTo)) annotations.remove(index);
  }
}

export async function writeAnnotations(saved: Uint8Array, changes: AnnotationChanges, me: string) {
  const document = await PDFDocument.load(saved);
  const { context } = document;
  for (const removed of changes.removals) remove(document, removed);
  // Referência e retângulo de cada comentário, para as respostas e as marcas de revisão apontarem para ele.
  const anchors = new Map<string, { ref: PDFRef; rect: number[] }>();
  for (const comment of changes.anchors) {
    const ref = refFromId(comment.id);
    if (ref) anchors.set(comment.id, { ref, rect: comment.rect ?? [0, 0, 24, 24] });
  }
  const signature = (author?: string, date?: string) => ({ author: author || me, date: date ? new Date(date) : undefined });
  for (const comment of changes.comments) {
    const page = document.getPage(comment.page - 1);
    const anchor = addComment(context, page.getSize(), comment, signature(comment.author, comment.date));
    page.node.addAnnot(anchor.ref);
    anchors.set(comment.id, anchor);
  }
  for (const reply of changes.replies) {
    const anchor = anchors.get(reply.parentId);
    if (anchor) document.getPage(reply.page - 1).node.addAnnot(addReply(context, anchor, reply, signature(reply.author, reply.date)));
  }
  for (const comment of changes.resolutions) {
    const anchor = anchors.get(comment.id);
    if (anchor) document.getPage(comment.page - 1).node.addAnnot(addAccepted(context, anchor, comment.id, signature()));
  }
  for (const highlight of changes.highlights) {
    const page = document.getPage(highlight.page - 1);
    const { width, height } = page.getSize();
    page.node.addAnnot(context.register(context.obj({
      Type: "Annot", Subtype: "Highlight", Rect: boundsOf(highlight.boxes, width, height), QuadPoints: quadsOf(highlight.boxes, width, height),
      C: rgbOf(highlight.color ?? DEFAULT_HIGHLIGHT), CA: 0.6,
    })));
  }
  await applyTextEdits(document, changes.textEdits);
  return document.save();
}
