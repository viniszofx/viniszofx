import { db } from "@/lib/db";
import { messageThreads } from "@/lib/db/schema/app";
import { currentOrganization, organizationPeople, unauthorized } from "@/lib/organizations/current";

/** Arquivar, silenciar ou bloquear uma conversa (vale só para quem marcou). */
export async function PUT(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const other = typeof body.with === "string" ? body.with : "";
  if (!other || other === context.userId || !(await organizationPeople(context.organizationId)).some(person => person.id === other)) return new Response("Conversa inválida.", { status: 400 });
  const change: Partial<typeof messageThreads.$inferInsert> = { updatedAt: new Date() };
  for (const key of ["archived", "muted", "blocked"] as const) if (typeof body[key] === "boolean") change[key] = body[key];
  await db.insert(messageThreads).values({ organizationId: context.organizationId, userId: context.userId, otherId: other, ...change })
    .onConflictDoUpdate({ target: [messageThreads.organizationId, messageThreads.userId, messageThreads.otherId], set: change });
  return new Response(null, { status: 204 });
}
