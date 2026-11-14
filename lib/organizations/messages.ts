import "server-only";
import { and, eq, gt, inArray, isNotNull, isNull, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages, messagePolicies, messagePresence, messageReactions, messageThreads, userProfiles } from "@/lib/db/schema/app";
import { deleteFile } from "@/lib/storage/server";

/** ownerId: conta em cujo storage o arquivo está (quem enviou primeiro; não muda ao encaminhar). */
export type Attachment = { fileId: string; name: string; type: string; size: number; ownerId?: string };
type Row = typeof directMessages.$inferSelect;
type Person = { id: string; name: string; email: string };

export const reportReasons = ["assedio", "ofensa", "spam", "conteudo-improprio", "outro"] as const;
export const autoDeleteOptions = [86400, 604800, 2592000] as const;
/** Online: visto há menos de 2 minutos (o app avisa a cada 60 s enquanto a tela está aberta). */
export const onlineWindow = 2 * 60 * 1000;

export const between = (organizationId: string, a: string, b: string) => and(eq(directMessages.organizationId, organizationId),
  or(and(eq(directMessages.senderId, a), eq(directMessages.recipientId, b)), and(eq(directMessages.senderId, b), eq(directMessages.recipientId, a))));

/** Ainda não expirou (autoexclusão). */
export const notExpired = () => or(isNull(directMessages.expiresAt), gt(directMessages.expiresAt, new Date()));

/** O que esta pessoa ainda vê da conversa: sem as expiradas e sem o que ela apagou só para si. */
export function visible(clearedAt: Date | null | undefined): SQL {
  return clearedAt ? and(notExpired(), gt(directMessages.createdAt, clearedAt))! : notExpired()!;
}

const pair = (a: string, b: string) => a < b ? [a, b] as const : [b, a] as const;

/** Preferências das duas pontas e a regra comum (autoexclusão) da conversa. */
export async function threadState(organizationId: string, me: string, other: string) {
  const [userA, userB] = pair(me, other);
  const [rows, [policy]] = await Promise.all([
    db.select().from(messageThreads).where(and(eq(messageThreads.organizationId, organizationId),
      or(and(eq(messageThreads.userId, me), eq(messageThreads.otherId, other)), and(eq(messageThreads.userId, other), eq(messageThreads.otherId, me))))),
    db.select({ autoDeleteSeconds: messagePolicies.autoDeleteSeconds }).from(messagePolicies)
      .where(and(eq(messagePolicies.organizationId, organizationId), eq(messagePolicies.userA, userA), eq(messagePolicies.userB, userB))).limit(1),
  ]);
  const mine = rows.find(row => row.userId === me);
  const theirs = rows.find(row => row.userId === other);
  return {
    archived: !!mine?.archived, muted: !!mine?.muted, blocked: !!mine?.blocked, blockedMe: !!theirs?.blocked,
    protectContent: !!mine?.protectContent, peerProtects: !!theirs?.protectContent, clearedAt: mine?.clearedAt ?? null,
    autoDeleteSeconds: policy?.autoDeleteSeconds ?? null,
  };
}

export async function setAutoDelete(organizationId: string, me: string, other: string, seconds: number | null) {
  const [userA, userB] = pair(me, other);
  await db.insert(messagePolicies).values({ organizationId, userA, userB, autoDeleteSeconds: seconds, updatedBy: me })
    .onConflictDoUpdate({ target: [messagePolicies.organizationId, messagePolicies.userA, messagePolicies.userB], set: { autoDeleteSeconds: seconds, updatedBy: me, updatedAt: new Date() } });
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

/** Remove os arquivos que pertencem a quem enviou (encaminhados de outra pessoa ficam com a dona). */
export async function deleteOwnFiles(message: Pick<Row, "senderId" | "forwarded" | "attachments">) {
  await Promise.allSettled(message.attachments.filter(item => (item.ownerId ?? message.senderId) === message.senderId && !message.forwarded)
    .map(item => deleteFile(message.senderId, item.fileId)));
}

/**
 * Autoexclusão sem tarefa agendada: as expiradas já não aparecem nas consultas (notExpired) e
 * são apagadas de vez, com os arquivos, quando alguém da organização abre as mensagens.
 */
export async function purgeExpired(organizationId: string) {
  const expired = await db.select({ id: directMessages.id, senderId: directMessages.senderId, forwarded: directMessages.forwarded, attachments: directMessages.attachments })
    .from(directMessages).where(and(eq(directMessages.organizationId, organizationId), isNotNull(directMessages.expiresAt), lte(directMessages.expiresAt, new Date()))).limit(200);
  if (!expired.length) return;
  await db.delete(directMessages).where(inArray(directMessages.id, expired.map(item => item.id)));
  await Promise.allSettled(expired.map(deleteOwnFiles));
}

/** Registra que a pessoa está com as mensagens abertas ("visto por último"). */
export async function touchPresence(organizationId: string, userId: string) {
  await db.insert(messagePresence).values({ organizationId, userId, lastSeenAt: new Date() })
    .onConflictDoUpdate({ target: [messagePresence.organizationId, messagePresence.userId], set: { lastSeenAt: new Date() } });
}

/** "Visto por último" de cada pessoa, respeitando a privacidade: quem esconde o próprio também não vê o dos outros. */
export async function presenceOf(organizationId: string, me: string) {
  const rows = await db.select().from(messagePresence).where(eq(messagePresence.organizationId, organizationId));
  const hidden = !!rows.find(row => row.userId === me)?.hidden;
  const seen = new Map<string, string | null>();
  for (const row of rows) if (row.userId !== me) seen.set(row.userId, hidden || row.hidden ? null : row.lastSeenAt.toISOString());
  return { hidden, seen };
}

export const avatarUrl = (userId: string, fileId: string | null | undefined) => fileId ? `/api/profile/avatar/${userId}?v=${fileId.slice(0, 8)}` : null;

/** Mensagem para o cliente: apagadas sem conteúdo, citação resumida, reações agrupadas e cartão de contato. */
export async function present(rows: Row[], me: string, people: Person[], options: { peerProtects?: boolean } = {}) {
  const ids = rows.map(row => row.id);
  const replyIds = [...new Set(rows.map(row => row.replyToId).filter((id): id is string => !!id))];
  const sharedIds = [...new Set(rows.map(row => row.sharedUserId).filter((id): id is string => !!id))];
  const [replies, reactions, photos] = await Promise.all([
    replyIds.length ? db.select({ id: directMessages.id, body: directMessages.body, senderId: directMessages.senderId, deletedAt: directMessages.deletedAt, attachments: directMessages.attachments })
      .from(directMessages).where(inArray(directMessages.id, replyIds)) : [],
    ids.length ? db.select().from(messageReactions).where(inArray(messageReactions.messageId, ids)) : [],
    sharedIds.length ? db.select({ userId: userProfiles.userId, avatarFileId: userProfiles.avatarFileId }).from(userProfiles).where(inArray(userProfiles.userId, sharedIds)) : [],
  ]);
  return rows.map(row => {
    const reply = replies.find(item => item.id === row.replyToId);
    const deleted = !!row.deletedAt;
    const groups = new Map<string, { emoji: string; count: number; mine: boolean }>();
    for (const reaction of reactions.filter(item => item.messageId === row.id)) {
      const group = groups.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, mine: false };
      group.count++; if (reaction.userId === me) group.mine = true;
      groups.set(reaction.emoji, group);
    }
    const shared = row.sharedUserId ? people.find(person => person.id === row.sharedUserId) : undefined;
    return {
      id: row.id, mine: row.senderId === me, createdAt: row.createdAt, readAt: row.readAt, editedAt: row.editedAt, deleted,
      forwarded: row.forwarded, forwardedFrom: row.forwardedFromName, expiresAt: row.expiresAt,
      // Protegida: quem recebe não encaminha nem baixa (vale para o que a outra pessoa enviou).
      protected: !!options.peerProtects && row.senderId !== me,
      body: deleted ? "" : row.body, attachments: deleted ? [] : row.attachments,
      contact: !deleted && row.sharedUserId ? shared ? { id: shared.id, name: shared.name || shared.email, email: shared.email, avatar: avatarUrl(shared.id, photos.find(item => item.userId === shared.id)?.avatarFileId) } : { id: row.sharedUserId, name: "Contato indisponível", email: "", avatar: null } : null,
      reactions: deleted ? [] : [...groups.values()],
      replyTo: reply ? { id: reply.id, mine: reply.senderId === me, body: reply.deletedAt ? "Mensagem apagada" : reply.body || (reply.attachments.length ? `📎 ${reply.attachments[0].name}` : "") } : null,
    };
  });
}
