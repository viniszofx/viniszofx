import { randomUUID } from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages, messageReports } from "@/lib/db/schema/app";
import { currentOrganization, organizationPeople, unauthorized } from "@/lib/organizations/current";
import { reportReasons } from "@/lib/organizations/messages";

/** Denunciar uma conversa ou uma mensagem dela. */
export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const reported = typeof body.with === "string" ? body.with : "";
  const reason = typeof body.reason === "string" ? body.reason : "";
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 1000) : "";
  if (!reportReasons.includes(reason as (typeof reportReasons)[number])) return new Response("Escolha o motivo da denúncia.", { status: 400 });
  if (!reported || reported === context.userId || !(await organizationPeople(context.organizationId)).some(person => person.id === reported)) return new Response("Conversa inválida.", { status: 400 });
  let messageId: string | null = null;
  let messageBody: string | null = null;
  if (typeof body.messageId === "string") {
    // Só mensagens desta conversa; guarda uma cópia do texto, que pode ser editado ou apagado depois.
    const [message] = await db.select({ id: directMessages.id, body: directMessages.body }).from(directMessages).where(and(eq(directMessages.id, body.messageId), eq(directMessages.organizationId, context.organizationId),
      or(and(eq(directMessages.senderId, reported), eq(directMessages.recipientId, context.userId)), and(eq(directMessages.senderId, context.userId), eq(directMessages.recipientId, reported))))).limit(1);
    if (!message) return new Response("Mensagem não encontrada nesta conversa.", { status: 404 });
    messageId = message.id; messageBody = message.body;
  }
  await db.insert(messageReports).values({ id: randomUUID(), organizationId: context.organizationId, reporterId: context.userId, reportedId: reported, messageId, messageBody, reason, details: details || null });
  return new Response(null, { status: 201 });
}

/** Denúncias da organização, para a administração revisar. */
export async function GET() {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  if (!context.admin) return new Response("Só a administração revisa denúncias.", { status: 403 });
  const [rows, people] = await Promise.all([
    db.select().from(messageReports).where(eq(messageReports.organizationId, context.organizationId)).orderBy(desc(messageReports.createdAt)).limit(200),
    organizationPeople(context.organizationId),
  ]);
  const name = (id: string | null) => { const person = id ? people.find(item => item.id === id) : undefined; return person ? person.name || person.email : "Pessoa removida"; };
  return Response.json({ reports: rows.map(row => ({ ...row, reporterName: name(row.reporterId), reportedName: name(row.reportedId), reviewerName: row.reviewedBy ? name(row.reviewedBy) : null })) }, { headers: { "Cache-Control": "private, no-store" } });
}
