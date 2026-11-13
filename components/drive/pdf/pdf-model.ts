import { type Box, boxesFromQuads, isoFromPdfDate, isResolved, type ParsedNote } from "./annotations/mod";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { pdfjs } from "./pdf-engine";

// Estado das anotações do PDF no visualizador: comentários, respostas e realces, com o que já está no arquivo e o que falta salvar.

export type HighlightBox = Box;
// Situação em relação ao arquivo: pendente (ainda não salvo) ou removido (e se a remoção já foi gravada).
type Tracked = { id: string; pending?: boolean; removed?: boolean; removedSaved?: boolean };
// Comentário no padrão do PDF: autor (/T), data (/M), respostas (/IRT) e situação de revisão (/State Accepted = resolvido).
export type Comment = Tracked & { page: number; text: string; x: number; y: number; rect?: number[]; synced?: boolean; popupRef?: string; quote?: string; boxes?: HighlightBox[]; highlighted?: boolean; author?: string; date?: string; resolved?: boolean; resolvedSource?: boolean; resolvePending?: boolean };
export type Reply = Tracked & { parentId: string; page: number; rect?: number[]; synced?: boolean; text: string; author?: string; date?: string; source: boolean; pending: boolean };
export type CommentDraft = Omit<Comment, "id" | "pending" | "author" | "date">;
export type PlainHighlight = Tracked & { page: number; boxes: HighlightBox[]; color?: string; rect?: number[]; popupRef?: string; pending: boolean; source?: boolean };

export const unsaved = (entry: Tracked) => !!entry.pending || !!entry.removed && !entry.removedSaved;
export const markSaved = <T extends Tracked>(entry: T): T => ({ ...entry, pending: false, removedSaved: !!(entry.removed || entry.removedSaved) });

// Tira o item da lista. O que já está no arquivo (keep) fica marcado como removido, para a remoção contar como
// alteração e ir para o arquivo ao salvar; o que nunca foi salvo simplesmente sai.
export function removeFrom<T extends Tracked>(list: T[], id: string, keep: (entry: T) => boolean): T[] {
  return list.flatMap((entry) => entry.id !== id ? [entry] : keep(entry) ? [{ ...entry, removed: true, removedSaved: false }] : []);
}

// Comentários, respostas e realces que já vêm no arquivo, como o pdf.js os leu.
export async function readViewerAnnotations(document: PDFDocumentProxy) {
  const perPage = await Promise.all(Array.from({ length: document.numPages }, async (_, index) => {
    const proxy = await document.getPage(index + 1);
    const annotations = await proxy.getAnnotations();
    const [, , width, height] = proxy.view;
    const page = index + 1;
    const comments: Comment[] = [];
    const highlights: PlainHighlight[] = [];
    const replies: Reply[] = [];
    const states: { parentId: string; state: string; id: string }[] = [];
    for (const annotation of annotations) {
      const isHighlight = annotation.annotationType === pdfjs.AnnotationType.HIGHLIGHT;
      const rect = Array.from(annotation.rect as ArrayLike<number>);
      const author = (annotation.titleObj?.str as string | undefined) || undefined;
      const date = isoFromPdfDate(annotation.modificationDate ?? annotation.creationDate);
      const text = annotation.contentsObj?.str as string | undefined;
      if (annotation.inReplyTo && annotation.replyType !== "Group") {
        // Resposta ou marca de revisão de outro comentário (como o Acrobat grava).
        if (annotation.stateModel === "Review" && annotation.state) states.push({ parentId: annotation.inReplyTo as string, state: annotation.state as string, id: annotation.id as string });
        else if (text) replies.push({ id: annotation.id as string, parentId: annotation.inReplyTo as string, page, text, author, date, source: true, pending: false });
        continue;
      }
      const boxes = isHighlight ? boxesFromQuads((annotation.quadPoints ?? []) as ArrayLike<number>, width, height) : [];
      if ((isHighlight || annotation.annotationType === pdfjs.AnnotationType.TEXT) && text) {
        comments.push({ id: annotation.id as string, page, text, x: rect[isHighlight ? 2 : 0] / width, y: 1 - rect[3] / height, rect, boxes: boxes.length ? boxes : undefined, popupRef: annotation.popupRef ?? undefined, highlighted: isHighlight, author, date });
      } else if (boxes.length) {
        highlights.push({ id: annotation.id as string, page, boxes, rect, color: hexOf(annotation.color as ArrayLike<number> | null), popupRef: annotation.popupRef ?? undefined, pending: false, source: true });
      }
    }
    return { comments, highlights, replies, states };
  }));
  const states = perPage.flatMap((entry) => entry.states);
  // A última marca de revisão vale.
  const lastState = new Map(states.map((entry) => [entry.parentId, entry.state]));
  const comments = perPage.flatMap((entry) => entry.comments).map((comment) => {
    const resolved = isResolved(lastState.get(comment.id));
    return { ...comment, resolved, resolvedSource: resolved };
  });
  const replies = perPage.flatMap((entry) => entry.replies);
  return {
    comments,
    replies,
    highlights: perPage.flatMap((entry) => entry.highlights),
    // Respostas e marcas de revisão: o pdf.js não desenha o ícone delas sobre a página.
    threadIds: new Set([...replies.map((reply) => reply.id), ...states.map((state) => state.id)]),
  };
}

export const hexOf = (rgb?: ArrayLike<number> | null) => rgb && rgb.length >= 3 ? `#${Array.from(rgb).slice(0, 3).map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}` : undefined;

// Texto da página sob as faixas de um realce (frações da página, de cima para baixo). Cada trecho de texto entra só na
// parte que a faixa cobre, proporcional à largura dele.
export function quoteFrom(page: PDFPageProxy, content: Awaited<ReturnType<PDFPageProxy["getTextContent"]>>, boxes: HighlightBox[]) {
  const [, , width, height] = page.view;
  const areas = boxes.map((box) => ({ left: box.left * width, right: box.right * width, bottom: (1 - box.bottom) * height, top: (1 - box.top) * height }));
  const parts: string[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str || !item.width) continue;
    const [a, b, , d, x, y] = item.transform as number[];
    if (Math.abs(b) > 0.01 || a <= 0) continue;
    const middle = y + (d || item.height) * 0.35;
    const area = areas.find((entry) => middle >= entry.bottom && middle <= entry.top && Math.min(entry.right, x + item.width) - Math.max(entry.left, x) > 1);
    if (!area) continue;
    const start = Math.max(0, Math.round((Math.max(area.left, x) - x) / item.width * item.str.length));
    const end = Math.min(item.str.length, Math.round((Math.min(area.right, x + item.width) - x) / item.width * item.str.length));
    parts.push(item.str.slice(start, end));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 2000);
}

// Índice das notas pelos dois nomes delas (/NM e a referência), que são os ids usados no visualizador.
function byId(notes: ParsedNote[]) {
  const found = new Map<string, ParsedNote>();
  for (const note of notes) {
    for (const key of [note.nm, note.refId]) if (key && !found.has(key)) found.set(key, note);
  }
  return found;
}
const knownIn = (ids: Set<string>, note: ParsedNote) => !!note.nm && ids.has(note.nm) || !!note.refId && ids.has(note.refId);

// Acerta comentários, respostas e resoluções com o que está no arquivo agora: o que chegou entra, o que foi apagado
// sai, o que foi resolvido some. O que ainda não foi salvo aqui fica como está. "erased" são os comentários do arquivo
// aberto que sumiram e precisam sair do desenho.
export function reconcileThreads(notes: ParsedNote[], current: { comments: Comment[]; replies: Reply[] }) {
  const roots = notes.filter((note) => !note.inReplyTo && note.text.trim());
  const answers = notes.filter((note) => note.inReplyTo && note.stateModel !== "Review" && note.text.trim());
  const states = new Map<string, string>();
  for (const note of notes) if (note.inReplyTo && note.stateModel === "Review" && note.state) states.set(note.inReplyTo, note.state);
  const rootsById = byId(roots);
  const answersById = byId(answers);
  const erased: Comment[] = [];
  const comments = current.comments.map((comment) => {
    if (comment.pending || comment.removed) return comment;
    const found = rootsById.get(comment.id);
    if (!found) {
      erased.push(comment);
      return { ...comment, removed: true, removedSaved: true };
    }
    return isResolved(states.get(found.refId ?? "")) && !comment.resolved ? { ...comment, resolved: true, resolvedSource: true } : comment;
  });
  const commentIds = new Set(current.comments.map((comment) => comment.id));
  for (const note of roots) {
    if (knownIn(commentIds, note)) continue;
    const resolved = isResolved(states.get(note.refId ?? ""));
    comments.push({ id: note.nm ?? note.refId ?? crypto.randomUUID(), page: note.page, text: note.text, x: note.x, y: note.y, rect: note.rect, boxes: note.boxes, highlighted: note.subtype === "Highlight", author: note.author, date: note.date, resolved, resolvedSource: resolved, synced: true });
  }
  const nextIds = new Set(comments.map((comment) => comment.id));
  const rootsByRef = new Map(roots.flatMap((note) => note.refId ? [[note.refId, note] as const] : []).reverse());
  const parentOf = (refId: string) => {
    const root = rootsByRef.get(refId);
    if (!root) return undefined;
    return root.nm && nextIds.has(root.nm) ? root.nm : root.refId && nextIds.has(root.refId) ? root.refId : root.nm ?? root.refId ?? undefined;
  };
  const replies = current.replies.map((reply) => reply.pending || reply.removed || answersById.has(reply.id) ? reply : { ...reply, removed: true, removedSaved: true });
  const replyIds = new Set(current.replies.map((reply) => reply.id));
  for (const note of answers) {
    const parentId = note.inReplyTo && parentOf(note.inReplyTo);
    if (!parentId || knownIn(replyIds, note)) continue;
    replies.push({ id: note.nm ?? note.refId ?? crypto.randomUUID(), parentId, page: note.page, rect: note.rect, text: note.text, author: note.author, date: note.date, source: false, pending: false, synced: true });
  }
  return { comments, replies, erased };
}
