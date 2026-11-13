import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages } from "@/lib/db/schema/app";
import { currentOrganization, organizationPeople, readOnly, unauthorized } from "@/lib/organizations/current";

const between = (organizationId: string, a: string, b: string) => and(eq(directMessages.organizationId, organizationId),
  or(and(eq(directMessages.senderId, a), eq(directMessages.recipientId, b)), and(eq(directMessages.senderId, b), eq(directMessages.recipientId, a))));

/** Sem `with`: pessoas da organização, última mensagem e não lidas. Com `with`: a conversa (e marca como lida). */
export async function GET(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  const other = new URL(request.url).searchParams.get("with");
  if (other) {
    if (other === context.userId || !(await organizationPeople(context.organizationId)).some(person => person.id === other)) {
      return new Response("Essa pessoa não está disponível nesta organização.", { status: 404 });
    }
    const messages = await db.select().from(directMessages).where(between(context.organizationId, context.userId, other)).orderBy(desc(directMessages.createdAt)).limit(300);
    await db.update(directMessages).set({ readAt: new Date() }).where(and(eq(directMessages.organizationId, context.organizationId), eq(directMessages.senderId, other), eq(directMessages.recipientId, context.userId), isNull(directMessages.readAt)));
    return Response.json({ messages: messages.reverse().map(message => ({ ...message, mine: message.senderId === context.userId })) }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const people = (await organizationPeople(context.organizationId)).filter(person => person.id !== context.userId);
  const unread = await db.select({ senderId: directMessages.senderId, count: sql<number>`count(*)::int` }).from(directMessages)
    .where(and(eq(directMessages.organizationId, context.organizationId), eq(directMessages.recipientId, context.userId), isNull(directMessages.readAt))).groupBy(directMessages.senderId);
  const latest = await db.selectDistinctOn([sql`least(${directMessages.senderId}, ${directMessages.recipientId})`, sql`greatest(${directMessages.senderId}, ${directMessages.recipientId})`], {
    senderId: directMessages.senderId, recipientId: directMessages.recipientId, body: directMessages.body, createdAt: directMessages.createdAt,
  }).from(directMessages).where(and(eq(directMessages.organizationId, context.organizationId), or(eq(directMessages.senderId, context.userId), eq(directMessages.recipientId, context.userId))))
    .orderBy(sql`least(${directMessages.senderId}, ${directMessages.recipientId})`, sql`greatest(${directMessages.senderId}, ${directMessages.recipientId})`, desc(directMessages.createdAt));
  return Response.json({
    me: context.userId,
    people: people.map(person => {
      const last = latest.find(item => item.senderId === person.id || item.recipientId === person.id);
      return { id: person.id, name: person.name || person.email, email: person.email, role: person.role, unread: unread.find(item => item.senderId === person.id)?.count ?? 0, last: last ? { body: last.body, createdAt: last.createdAt, mine: last.senderId === context.userId } : null };
    }).sort((a, b) => (b.last?.createdAt?.toString() ?? "").localeCompare(a.last?.createdAt?.toString() ?? "") || a.name.localeCompare(b.name, "pt-BR")),
    unread: unread.reduce((total, item) => total + item.count, 0),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  if (context.role === "external" && !context.admin) return readOnly();
  const body = await request.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return new Response("Escreva a mensagem.", { status: 400 });
  if (text.length > 5000) return new Response("A mensagem pode ter até 5.000 caracteres.", { status: 400 });
  const people = await organizationPeople(context.organizationId);
  if (!people.some(person => person.id === to) || to === context.userId) return new Response("Escolha alguém da organização.", { status: 400 });
  await db.insert(directMessages).values({ id: randomUUID(), organizationId: context.organizationId, senderId: context.userId, recipientId: to, body: text });
  return new Response(null, { status: 201 });
}

