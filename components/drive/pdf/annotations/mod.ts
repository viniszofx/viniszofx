import { type PDFContext, PDFArray, PDFHexString, PDFNumber, type PDFObject, PDFRef, PDFString } from "pdf-lib";

// Comentários no padrão de anotações do PDF, usados pelo app (ao salvar) e pelo servidor (cada ação de comentário):
// autor (/T), data (/M), respostas (/IRT) e situação de revisão (/StateModel Review, /State Accepted = resolvido).
// Qualquer leitor de PDF mostra.

// Faixa marcada na página, em frações dela (0 a 1, de cima para baixo).
export type Box = { left: number; top: number; right: number; bottom: number };

export type CommentAction =
  | { action: "add"; id: string; page: number; x: number; y: number; text: string; quote?: string; boxes?: Box[] }
  | { action: "reply"; id: string; parentId: string; text: string }
  | { action: "resolve"; id: string }
  | { action: "delete"; id: string };

// Nome único (/NM) da marca de revisão que resolve um comentário.
export const acceptedId = (commentId: string): string => `${commentId}-aceito`;

// A última marca de revisão vale: Aceito ou Concluído é conversa resolvida.
export const isResolved = (state?: string | null): boolean => state === "Accepted" || state === "Completed";

// Data no formato do PDF (D:AAAAMMDDHHmmSSZ).
export function pdfDate(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `D:${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

// Data do PDF de volta para ISO, com o fuso quando houver (+03'00'); sem fuso, lida como UTC.
export function isoFromPdfDate(value?: string | null): string | undefined {
  const match = value && /^(?:D:)?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([Z+-])?(\d{2})?'?(\d{2})?/.exec(value);
  if (!match) return undefined;
  const [, year, month = "01", day = "01", hour = "00", minute = "00", second = "00", sign, offsetHours = "0", offsetMinutes = "0"] = match;
  const offset = sign === "+" || sign === "-" ? (sign === "+" ? 1 : -1) * (+offsetHours * 60 + +offsetMinutes) : 0;
  const date = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute - offset, +second));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export const textOf = (value: unknown): string | undefined => value instanceof PDFString || value instanceof PDFHexString ? value.decodeText() : undefined;
export const numbersOf = (value: unknown): number[] => value instanceof PDFArray ? value.asArray().map((entry) => entry instanceof PDFNumber ? entry.asNumber() : 0) : [];

// Mesmo formato de id do pdf.js ("12R", "12R3").
export const refId = (ref: PDFRef): string => `${ref.objectNumber}R${ref.generationNumber || ""}`;
const REF_ID = /^(\d+)R(\d*)$/;
export const isRefId = (id: string): boolean => REF_ID.test(id);
export function refFromId(id: string): PDFRef | null {
  const match = REF_ID.exec(id);
  return match ? PDFRef.of(Number(match[1]), Number(match[2] || 0)) : null;
}

// Faixas a partir dos /QuadPoints (8 números por faixa, em pontos do PDF, de baixo para cima).
export function boxesFromQuads(quads: ArrayLike<number>, width: number, height: number): Box[] {
  const boxes: Box[] = [];
  for (let point = 0; point + 7 < quads.length; point += 8) {
    boxes.push({ left: quads[point] / width, top: 1 - quads[point + 1] / height, right: quads[point + 2] / width, bottom: 1 - quads[point + 5] / height });
  }
  return boxes;
}

export function quadsOf(boxes: Box[], width: number, height: number): number[] {
  return boxes.flatMap((box) => {
    const [left, right, top, bottom] = [box.left * width, box.right * width, (1 - box.top) * height, (1 - box.bottom) * height];
    return [left, top, right, top, left, bottom, right, bottom];
  });
}

// Retângulo (/Rect) que envolve as faixas.
export function boundsOf(boxes: Box[], width: number, height: number): number[] {
  let [x1, y1, x2, y2] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const box of boxes) {
    x1 = Math.min(x1, box.left * width);
    y1 = Math.min(y1, (1 - box.bottom) * height);
    x2 = Math.max(x2, box.right * width);
    y2 = Math.max(y2, (1 - box.top) * height);
  }
  return [x1, y1, x2, y2];
}

export type Signature = { author: string; date?: Date; extra?: Record<string, PDFObject> };
export type Anchor = { ref: PDFRef; rect: number[] };

function signed({ author, date, extra }: Signature) {
  const when = PDFString.of(pdfDate(date));
  return { T: PDFHexString.fromText(author), M: when, CreationDate: when, ...extra };
}

// Comentário novo: realce com texto quando marca um trecho, senão um ícone de nota no ponto (x, y em frações da página).
export function addComment(context: PDFContext, page: { width: number; height: number }, comment: { id: string; text: string; x: number; y: number; boxes?: Box[] }, signature: Signature): Anchor {
  const { width, height } = page;
  const boxes = comment.boxes ?? [];
  const x = Math.max(0, Math.min(width - 24, comment.x * width));
  const y = Math.max(0, Math.min(height - 24, (1 - comment.y) * height));
  const rect = boxes.length ? boundsOf(boxes, width, height) : [x, y, x + 24, y + 24];
  const annotation = context.obj(boxes.length
    ? {
      Type: "Annot", Subtype: "Highlight", F: 4, NM: PDFString.of(comment.id), Rect: rect, QuadPoints: quadsOf(boxes, width, height),
      Contents: PDFHexString.fromText(comment.text), C: [1, 0.85, 0.25], CA: 0.45, ...signed(signature),
    }
    : {
      Type: "Annot", Subtype: "Text", Rect: rect, NM: PDFString.of(comment.id),
      Contents: PDFHexString.fromText(comment.text), Name: "Comment", C: [1, 0.8, 0.2], ...signed(signature),
    });
  return { ref: context.register(annotation), rect };
}

export function addReply(context: PDFContext, parent: Anchor, reply: { id: string; text: string }, signature: Signature): PDFRef {
  return context.register(context.obj({
    Type: "Annot", Subtype: "Text", Rect: parent.rect, IRT: parent.ref, RT: "R", NM: PDFString.of(reply.id),
    Contents: PDFHexString.fromText(reply.text), Name: "Comment", C: [1, 0.8, 0.2], Open: false, ...signed(signature),
  }));
}

// Marca de revisão como a do Acrobat: resposta oculta com /StateModel Review e /State Accepted.
export function addAccepted(context: PDFContext, parent: Anchor, commentId: string, signature: Signature): PDFRef {
  return context.register(context.obj({
    Type: "Annot", Subtype: "Text", Rect: parent.rect, IRT: parent.ref, RT: "R", F: 2, NM: PDFString.of(acceptedId(commentId)),
    StateModel: PDFString.of("Review"), State: PDFString.of("Accepted"), Contents: PDFHexString.fromText(`Aceito por ${signature.author}`), ...signed(signature),
  }));
}

export { mergeAnnotations, type ParsedNote, readNotes } from "./threads";
