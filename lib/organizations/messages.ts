import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages, messageThreads } from "@/lib/db/schema/app";

/** ownerId: conta em cujo storage o arquivo está (quem enviou primeiro; não muda ao encaminhar). */
export type Attachment = { fileId: string; name: string; type: string; size: number; ownerId?: string };
type Row = typeof directMessages.$inferSelect;

export const between = (organizationId: string, a: string, b: string) => and(eq(directMessages.organizationId, organizationId),
  or(and(eq(directMessages.senderId, a), eq(directMessages.recipientId, b)), and(eq(directMessages.senderId, b), eq(directMessages.recipientId, a))));

/** Preferências das duas pontas: o que eu marquei e se a outra pessoa me bloqueou. */
export async function threadState(organizationId: string, me: string, other: string) {
  const rows = await db.select().from(messageThreads).where(and(eq(messageThreads.organizationId, organizationId),
    or(and(eq(messageThreads.userId, me), eq(messageThreads.otherId, other)), and(eq(messageThreads.userId, other), eq(messageThreads.otherId, me)))));
  const mine = rows.find(row => row.userId === me);
  const theirs = rows.find(row => row.userId === other);
  return { archived: !!mine?.archived, muted: !!mine?.muted, blocked: !!mine?.blocked, blockedMe: !!theirs?.blocked };
}

/** Anexos novos sempre pertencem a quem envia: o cliente não escolhe de quem é o arquivo. */
export function parseAttachments(value: unknown, ownerId: string): Attachment[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 10).flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    if (typeof entry.fileId !== "string" || !/^[0-9a-f-]{36}$/.test(entry.fileId)) return [];
    return [{ fileId: entry.fileId, name: String(entry.name ?? "arquivo").slice(0, 200), type: String(entry.type ?? "application/octet-stream").slice(0, 100), size: Number(entry.size) || 0, ownerId }];
  });
}

/** Mensagem para o cliente: apagadas sem conteúdo e a citação da resposta resumida. */
export async function present(rows: Row[], me: string) {
  const replyIds = [...new Set(rows.map(row => row.replyToId).filter((id): id is string => !!id))];
  const replies = replyIds.length ? await db.select({ id: directMessages.id, body: directMessages.body, senderId: directMessages.senderId, deletedAt: directMessages.deletedAt, attachments: directMessages.attachments })
    .from(directMessages).where(inArray(directMessages.id, replyIds)) : [];
  return rows.map(row => {
    const reply = replies.find(item => item.id === row.replyToId);
    const deleted = !!row.deletedAt;
    return {
      id: row.id, mine: row.senderId === me, createdAt: row.createdAt, readAt: row.readAt, editedAt: row.editedAt, forwarded: row.forwarded, deleted,
      body: deleted ? "" : row.body, attachments: deleted ? [] : row.attachments,
      replyTo: reply ? { id: reply.id, mine: reply.senderId === me, body: reply.deletedAt ? "Mensagem apagada" : reply.body || (reply.attachments.length ? `📎 ${reply.attachments[0].name}` : "") } : null,
    };
  });
}
