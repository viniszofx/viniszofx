import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema/app";
import { requirePlatformAdmin, sameOrigin } from "@/lib/organizations/guard";

type Context = { params: Promise<{ leadId: string }> };
const statuses = ["new", "contacted", "qualified", "won", "lost"] as const;

/** Atualiza a etapa do funil, anotações, próximo contato e o cliente gerado. */
export async function PATCH(request: Request, context: Context) {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { leadId } = await context.params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const change: Partial<typeof leads.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.status === "string") {
    if (!statuses.includes(body.status as never)) return Response.json({ error: "Etapa inválida." }, { status: 400 });
    change.status = body.status as (typeof statuses)[number];
  }
  if (typeof body.notes === "string") change.notes = body.notes.slice(0, 10_000);
  if ("nextContactAt" in body) change.nextContactAt = typeof body.nextContactAt === "string" && body.nextContactAt && !Number.isNaN(Date.parse(body.nextContactAt)) ? new Date(body.nextContactAt) : null;
  if (typeof body.clientId === "string") change.clientId = body.clientId.slice(0, 64);
  const [updated] = await db.update(leads).set(change).where(eq(leads.id, leadId)).returning();
  if (!updated) return Response.json({ error: "Lead não encontrado." }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(request: Request, context: Context) {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { leadId } = await context.params;
  await db.delete(leads).where(eq(leads.id, leadId));
  return new Response(null, { status: 204 });
}
