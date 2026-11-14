import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages, messageThreads } from "@/lib/db/schema/app";
import { currentOrganization, organizationPeople, unauthorized } from "@/lib/organizations/current";
import { autoDeleteOptions, setAutoDelete } from "@/lib/organizations/messages";

/**
 * Preferências de uma conversa. Valem só para quem marcou: arquivar, silenciar, bloquear,
 * proteger o próprio conteúdo e apagar a conversa (`clear`). A autoexclusão vale para as duas pessoas.
 */
export async function PUT(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const other = typeof body.with === "string" ? body.with : "";
  if (!other || !(await organizationPeople(context.organizationId)).some(person => person.id === other)) return new Response("Conversa inválida.", { status: 400 });
  if ("autoDeleteSeconds" in body) {
    const seconds = body.autoDeleteSeconds === null ? null : Number(body.autoDeleteSeconds);
    if (seconds !== null && !autoDeleteOptions.includes(seconds as (typeof autoDeleteOptions)[number])) return new Response("Prazo de autoexclusão inválido.", { status: 400 });
    await setAutoDelete(context.organizationId, context.userId, other, seconds);
  }
  const change: Partial<typeof messageThreads.$inferInsert> = { updatedAt: new Date() };
  // Em "Mensagens salvas" (consigo mesma) só faz sentido arquivar, apagar e autoexclusão.
  for (const key of ["archived", "muted", "blocked", "protectContent"] as const) if (typeof body[key] === "boolean" && (key === "archived" || other !== context.userId)) change[key] = body[key];
  if (body.clear === true) {
    change.clearedAt = new Date();
    // O que foi apagado não fica contando como não lido.
    await db.update(directMessages).set({ readAt: new Date() }).where(and(eq(directMessages.organizationId, context.organizationId), eq(directMessages.senderId, other), eq(directMessages.recipientId, context.userId), isNull(directMessages.readAt)));
  }
  await db.insert(messageThreads).values({ organizationId: context.organizationId, userId: context.userId, otherId: other, ...change })
    .onConflictDoUpdate({ target: [messageThreads.organizationId, messageThreads.userId, messageThreads.otherId], set: change });
  return new Response(null, { status: 204 });
}
