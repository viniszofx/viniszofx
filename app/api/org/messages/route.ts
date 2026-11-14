import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages, messageThreads } from "@/lib/db/schema/app";
import { currentOrganization, organizationPeople, readOnly, unauthorized } from "@/lib/organizations/current";
import { between, parseAttachments, present, threadState } from "@/lib/organizations/messages";

const PAGE = 50;
const like = (value: string) => `%${value.replace(/[%_\\]/g, "\\$&")}%`;

/**
 * Sem `with`: pessoas, última mensagem, não lidas e preferências de cada conversa (e busca em todas com `q`).
 * Com `with`: a conversa paginada (`before`), com busca (`q`), e marca como lida.
 */
export async function GET(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  const url = new URL(request.url);
  const other = url.searchParams.get("with");
  const query = url.searchParams.get("q")?.trim().slice(0, 200) ?? "";
  const people = await organizationPeople(context.organizationId);
  if (other) {
    if (other === context.userId || !people.some(person => person.id === other)) return new Response("Essa pessoa não está disponível nesta organização.", { status: 404 });
    const before = url.searchParams.get("before");
    const conditions = [between(context.organizationId, context.userId, other)];
    if (before && !Number.isNaN(Date.parse(before))) conditions.push(lt(directMessages.createdAt, new Date(before)));
    if (query) conditions.push(ilike(directMessages.body, like(query)), isNull(directMessages.deletedAt));
    const rows = await db.select().from(directMessages).where(and(...conditions)).orderBy(desc(directMessages.createdAt)).limit(PAGE + 1);
    if (!query && !before) await db.update(directMessages).set({ readAt: new Date() }).where(and(eq(directMessages.organizationId, context.organizationId), eq(directMessages.senderId, other), eq(directMessages.recipientId, context.userId), isNull(directMessages.readAt)));
    return Response.json({ messages: await present(rows.slice(0, PAGE).reverse(), context.userId), hasMore: rows.length > PAGE, thread: await threadState(context.organizationId, context.userId, other) }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const others = people.filter(person => person.id !== context.userId);
  const mine = or(eq(directMessages.senderId, context.userId), eq(directMessages.recipientId, context.userId));
  if (query) {
    const found = await db.select().from(directMessages).where(and(eq(directMessages.organizationId, context.organizationId), mine, isNull(directMessages.deletedAt), ilike(directMessages.body, like(query)))).orderBy(desc(directMessages.createdAt)).limit(50);
    return Response.json({ results: found.map(row => ({ id: row.id, with: row.senderId === context.userId ? row.recipientId : row.senderId, body: row.body, createdAt: row.createdAt, mine: row.senderId === context.userId })) }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const unread = await db.select({ senderId: directMessages.senderId, count: sql<number>`count(*)::int` }).from(directMessages)
    .where(and(eq(directMessages.organizationId, context.organizationId), eq(directMessages.recipientId, context.userId), isNull(directMessages.readAt), isNull(directMessages.deletedAt))).groupBy(directMessages.senderId);
  const latest = await db.selectDistinctOn([sql`least(${directMessages.senderId}, ${directMessages.recipientId})`, sql`greatest(${directMessages.senderId}, ${directMessages.recipientId})`], {
    senderId: directMessages.senderId, recipientId: directMessages.recipientId, body: directMessages.body, createdAt: directMessages.createdAt, deletedAt: directMessages.deletedAt, attachments: directMessages.attachments,
  }).from(directMessages).where(and(eq(directMessages.organizationId, context.organizationId), mine))
    .orderBy(sql`least(${directMessages.senderId}, ${directMessages.recipientId})`, sql`greatest(${directMessages.senderId}, ${directMessages.recipientId})`, desc(directMessages.createdAt));
  const prefs = await db.select().from(messageThreads).where(and(eq(messageThreads.organizationId, context.organizationId), eq(messageThreads.userId, context.userId)));
  const list = others.map(person => {
    const last = latest.find(item => item.senderId === person.id || item.recipientId === person.id);
    const pref = prefs.find(item => item.otherId === person.id);
    const count = unread.find(item => item.senderId === person.id)?.count ?? 0;
    const preview = !last ? "" : last.deletedAt ? "Mensagem apagada" : last.body || (last.attachments.length ? `📎 ${last.attachments[0].name}` : "");
    return { id: person.id, name: person.name || person.email, email: person.email, role: person.role,
      unread: count, archived: !!pref?.archived, muted: !!pref?.muted, blocked: !!pref?.blocked,
      last: last ? { body: preview, createdAt: last.createdAt, mine: last.senderId === context.userId } : null };
  }).sort((a, b) => (b.last?.createdAt?.toString() ?? "").localeCompare(a.last?.createdAt?.toString() ?? "") || a.name.localeCompare(b.name, "pt-BR"));
  // O selo de não lidas ignora conversas silenciadas e arquivadas.
  return Response.json({ me: context.userId, people: list, unread: list.filter(item => !item.archived && !item.muted).reduce((total, item) => total + item.unread, 0) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  if (context.role === "external" && !context.admin) return readOnly();
  const body = await request.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to : "";
  let text = typeof body.body === "string" ? body.body.trim() : "";
  let attachments = parseAttachments(body.attachments, context.userId);
  let forwarded = false;
  // Encaminhar: o servidor copia texto e anexos da mensagem original, que a pessoa precisa ter enviado ou recebido.
  if (typeof body.forwardOf === "string") {
    const [original] = await db.select().from(directMessages).where(and(eq(directMessages.id, body.forwardOf), eq(directMessages.organizationId, context.organizationId), isNull(directMessages.deletedAt), or(eq(directMessages.senderId, context.userId), eq(directMessages.recipientId, context.userId)))).limit(1);
    if (!original) return new Response("Mensagem não encontrada para encaminhar.", { status: 404 });
    text = original.body; attachments = original.attachments.map(item => ({ ...item, ownerId: item.ownerId ?? original.senderId })); forwarded = true;
  }
  if (!text && !attachments.length) return new Response("Escreva a mensagem ou anexe um arquivo.", { status: 400 });
  if (text.length > 5000) return new Response("A mensagem pode ter até 5.000 caracteres.", { status: 400 });
  const people = await organizationPeople(context.organizationId);
  if (!people.some(person => person.id === to) || to === context.userId) return new Response("Escolha alguém da organização.", { status: 400 });
  const state = await threadState(context.organizationId, context.userId, to);
  if (state.blocked) return new Response("Você bloqueou esta pessoa. Desbloqueie para enviar.", { status: 403 });
  if (state.blockedMe) return new Response("Não é possível enviar mensagens para esta pessoa.", { status: 403 });
  let replyToId: string | null = null;
  if (typeof body.replyToId === "string") {
    const [reply] = await db.select({ id: directMessages.id }).from(directMessages).where(and(eq(directMessages.id, body.replyToId), between(context.organizationId, context.userId, to))).limit(1);
    replyToId = reply?.id ?? null;
  }
  const id = randomUUID();
  await db.insert(directMessages).values({ id, organizationId: context.organizationId, senderId: context.userId, recipientId: to, body: text, attachments, replyToId, forwarded });
  // Enviar tira a conversa das arquivadas de quem enviou.
  await db.update(messageThreads).set({ archived: false, updatedAt: new Date() }).where(and(eq(messageThreads.organizationId, context.organizationId), eq(messageThreads.userId, context.userId), eq(messageThreads.otherId, to)));
  return Response.json({ id }, { status: 201 });
}
