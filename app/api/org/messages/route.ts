import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages, messageThreads, userProfiles } from "@/lib/db/schema/app";
import { currentOrganization, organizationPeople, readOnly, unauthorized } from "@/lib/organizations/current";
import { avatarUrl, between, notExpired, parseAttachments, presenceOf, present, purgeExpired, threadState, touchPresence, visible } from "@/lib/organizations/messages";

const PAGE = 50;
const like = (value: string) => `%${value.replace(/[%_\\]/g, "\\$&")}%`;
const noStore = { "Cache-Control": "private, no-store" };

/**
 * Sem `with`: pessoas, última mensagem, não lidas, preferências e "visto por último" (e busca em todas com `q`).
 * Com `with`: a conversa paginada (`before`), com busca (`q`) ou só mídia e arquivos (`shared=1`), e marca como lida.
 */
export async function GET(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  const url = new URL(request.url);
  const other = url.searchParams.get("with");
  const query = url.searchParams.get("q")?.trim().slice(0, 200) ?? "";
  const [people] = await Promise.all([organizationPeople(context.organizationId), purgeExpired(context.organizationId)]);
  if (other) {
    if (other === context.userId || !people.some(person => person.id === other)) return new Response("Essa pessoa não está disponível nesta organização.", { status: 404 });
    const thread = await threadState(context.organizationId, context.userId, other);
    const conditions = [between(context.organizationId, context.userId, other), visible(thread.clearedAt)];
    if (url.searchParams.get("shared") === "1") {
      const rows = await db.select().from(directMessages).where(and(...conditions, isNull(directMessages.deletedAt), sql`jsonb_array_length(${directMessages.attachments}) > 0`))
        .orderBy(desc(directMessages.createdAt)).limit(300);
      return Response.json({ messages: await present(rows, context.userId, people, { peerProtects: thread.peerProtects }) }, { headers: noStore });
    }
    const before = url.searchParams.get("before");
    if (before && !Number.isNaN(Date.parse(before))) conditions.push(lt(directMessages.createdAt, new Date(before)));
    if (query) conditions.push(ilike(directMessages.body, like(query)), isNull(directMessages.deletedAt));
    const rows = await db.select().from(directMessages).where(and(...conditions)).orderBy(desc(directMessages.createdAt)).limit(PAGE + 1);
    if (!query && !before) await db.update(directMessages).set({ readAt: new Date() }).where(and(eq(directMessages.organizationId, context.organizationId), eq(directMessages.senderId, other), eq(directMessages.recipientId, context.userId), isNull(directMessages.readAt)));
    return Response.json({ messages: await present(rows.slice(0, PAGE).reverse(), context.userId, people, { peerProtects: thread.peerProtects }), hasMore: rows.length > PAGE, thread: { ...thread, clearedAt: undefined } }, { headers: noStore });
  }
  const others = people.filter(person => person.id !== context.userId);
  const mine = or(eq(directMessages.senderId, context.userId), eq(directMessages.recipientId, context.userId));
  const prefs = await db.select().from(messageThreads).where(and(eq(messageThreads.organizationId, context.organizationId), eq(messageThreads.userId, context.userId)));
  const clearedFor = (id: string) => prefs.find(item => item.otherId === id)?.clearedAt ?? null;
  if (query) {
    const found = await db.select().from(directMessages).where(and(eq(directMessages.organizationId, context.organizationId), mine, notExpired(), isNull(directMessages.deletedAt), ilike(directMessages.body, like(query)))).orderBy(desc(directMessages.createdAt)).limit(80);
    const results = found.map(row => ({ id: row.id, with: row.senderId === context.userId ? row.recipientId : row.senderId, body: row.body, createdAt: row.createdAt, mine: row.senderId === context.userId }))
      .filter(row => { const cleared = clearedFor(row.with); return !cleared || row.createdAt > cleared; }).slice(0, 50);
    return Response.json({ results }, { headers: noStore });
  }
  await touchPresence(context.organizationId, context.userId);
  const [unread, latest, photos, presence] = await Promise.all([
    db.select({ senderId: directMessages.senderId, count: sql<number>`count(*)::int` }).from(directMessages)
      .where(and(eq(directMessages.organizationId, context.organizationId), eq(directMessages.recipientId, context.userId), isNull(directMessages.readAt), isNull(directMessages.deletedAt), notExpired())).groupBy(directMessages.senderId),
    db.selectDistinctOn([sql`least(${directMessages.senderId}, ${directMessages.recipientId})`, sql`greatest(${directMessages.senderId}, ${directMessages.recipientId})`], {
      senderId: directMessages.senderId, recipientId: directMessages.recipientId, body: directMessages.body, createdAt: directMessages.createdAt, deletedAt: directMessages.deletedAt, attachments: directMessages.attachments, sharedUserId: directMessages.sharedUserId,
    }).from(directMessages).where(and(eq(directMessages.organizationId, context.organizationId), mine, notExpired()))
      .orderBy(sql`least(${directMessages.senderId}, ${directMessages.recipientId})`, sql`greatest(${directMessages.senderId}, ${directMessages.recipientId})`, desc(directMessages.createdAt)),
    others.length ? db.select({ userId: userProfiles.userId, avatarFileId: userProfiles.avatarFileId }).from(userProfiles).where(and(inArray(userProfiles.userId, others.map(person => person.id)), isNotNull(userProfiles.avatarFileId))) : [],
    presenceOf(context.organizationId, context.userId),
  ]);
  const list = others.map(person => {
    const cleared = clearedFor(person.id);
    const found = latest.find(item => item.senderId === person.id || item.recipientId === person.id);
    // Conversa apagada só para mim: a prévia some até chegar mensagem nova.
    const last = found && (!cleared || found.createdAt > cleared) ? found : undefined;
    const pref = prefs.find(item => item.otherId === person.id);
    const count = unread.find(item => item.senderId === person.id)?.count ?? 0;
    const preview = !last ? "" : last.deletedAt ? "Mensagem apagada" : last.body || (last.sharedUserId ? "👤 Contato" : last.attachments.length ? `📎 ${last.attachments[0].name}` : "");
    return { id: person.id, name: person.name || person.email, email: person.email, role: person.role, avatar: avatarUrl(person.id, photos.find(item => item.userId === person.id)?.avatarFileId),
      unread: count, archived: !!pref?.archived, muted: !!pref?.muted, blocked: !!pref?.blocked, lastSeen: presence.seen.get(person.id) ?? null,
      last: last ? { body: preview, createdAt: last.createdAt, mine: last.senderId === context.userId } : null };
  }).sort((a, b) => (b.last?.createdAt?.toString() ?? "").localeCompare(a.last?.createdAt?.toString() ?? "") || a.name.localeCompare(b.name, "pt-BR"));
  // O selo de não lidas ignora conversas silenciadas e arquivadas.
  return Response.json({ me: context.userId, admin: context.admin, presenceHidden: presence.hidden, people: list, unread: list.filter(item => !item.archived && !item.muted).reduce((total, item) => total + item.unread, 0) }, { headers: noStore });
}

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  if (context.role === "external" && !context.admin) return readOnly();
  const body = await request.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to : "";
  let text = typeof body.body === "string" ? body.body.trim() : "";
  let attachments = parseAttachments(body.attachments, context.userId);
  let sharedUserId: string | null = typeof body.contact === "string" ? body.contact : null;
  let forwarded = false;
  let forwardedFromName: string | null = null;
  const people = await organizationPeople(context.organizationId);
  if (!people.some(person => person.id === to) || to === context.userId) return new Response("Escolha alguém da organização.", { status: 400 });
  // Encaminhar: o servidor copia texto, anexos e contato da mensagem original, que a pessoa precisa ter enviado ou recebido.
  if (typeof body.forwardOf === "string") {
    const [original] = await db.select().from(directMessages).where(and(eq(directMessages.id, body.forwardOf), eq(directMessages.organizationId, context.organizationId), isNull(directMessages.deletedAt), notExpired(), or(eq(directMessages.senderId, context.userId), eq(directMessages.recipientId, context.userId)))).limit(1);
    if (!original) return new Response("Mensagem não encontrada para encaminhar.", { status: 404 });
    if (original.senderId !== context.userId && (await threadState(context.organizationId, context.userId, original.senderId)).peerProtects) return new Response("Quem enviou protegeu o conteúdo: não dá para encaminhar.", { status: 403 });
    text = original.body; sharedUserId = original.sharedUserId; forwarded = true;
    attachments = original.attachments.map(item => ({ ...item, ownerId: item.ownerId ?? original.senderId }));
    forwardedFromName = original.forwardedFromName ?? (original.senderId === context.userId ? null : people.find(person => person.id === original.senderId)?.name || null);
  }
  if (sharedUserId && !people.some(person => person.id === sharedUserId)) return new Response("Esse contato não está na organização.", { status: 400 });
  if (!text && !attachments.length && !sharedUserId) return new Response("Escreva a mensagem ou anexe um arquivo.", { status: 400 });
  if (text.length > 5000) return new Response("A mensagem pode ter até 5.000 caracteres.", { status: 400 });
  const state = await threadState(context.organizationId, context.userId, to);
  if (state.blocked) return new Response("Você bloqueou esta pessoa. Desbloqueie para enviar.", { status: 403 });
  if (state.blockedMe) return new Response("Não é possível enviar mensagens para esta pessoa.", { status: 403 });
  let replyToId: string | null = null;
  if (typeof body.replyToId === "string") {
    const [reply] = await db.select({ id: directMessages.id }).from(directMessages).where(and(eq(directMessages.id, body.replyToId), between(context.organizationId, context.userId, to))).limit(1);
    replyToId = reply?.id ?? null;
  }
  const id = randomUUID();
  const expiresAt = state.autoDeleteSeconds ? new Date(Date.now() + state.autoDeleteSeconds * 1000) : null;
  await db.insert(directMessages).values({ id, organizationId: context.organizationId, senderId: context.userId, recipientId: to, body: text, attachments, replyToId, forwarded, forwardedFromName, sharedUserId, expiresAt });
  // Mensagem nova tira a conversa das arquivadas, para quem envia e para quem recebe.
  await db.update(messageThreads).set({ archived: false, updatedAt: new Date() }).where(and(eq(messageThreads.organizationId, context.organizationId), eq(messageThreads.archived, true),
    or(and(eq(messageThreads.userId, context.userId), eq(messageThreads.otherId, to)), and(eq(messageThreads.userId, to), eq(messageThreads.otherId, context.userId)))));
  return Response.json({ id }, { status: 201 });
}
