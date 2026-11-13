import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers } from "@/lib/db/schema/app";
import { requirePlatformAdmin, sameOrigin } from "@/lib/organizations/guard";

type Context = { params: Promise<{ organizationId: string; membershipId: string }> };

export async function PATCH(request: Request, context: Context) {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { organizationId, membershipId } = await context.params;
  const body = await request.json().catch(() => null) as { role?: unknown; status?: unknown } | null;
  const values: { role?: "member" | "external"; status?: "active" | "blocked"; updatedAt: Date } = { updatedAt: new Date() };
  if (body?.role !== undefined) {
    if (body.role !== "member" && body.role !== "external") return Response.json({ error: "Função inválida." }, { status: 400 });
    values.role = body.role;
  }
  if (body?.status !== undefined) {
    if (body.status !== "active" && body.status !== "blocked") return Response.json({ error: "Status inválido." }, { status: 400 });
    values.status = body.status;
  }
  if (Object.keys(values).length === 1) return Response.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  const [member] = await db.update(organizationMembers).set(values).where(and(
    eq(organizationMembers.id, membershipId), eq(organizationMembers.organizationId, organizationId),
  )).returning({ id: organizationMembers.id, role: organizationMembers.role, status: organizationMembers.status });
  if (!member) return Response.json({ error: "Membro não encontrado." }, { status: 404 });
  return Response.json(member);
}

export async function DELETE(request: Request, context: Context) {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { organizationId, membershipId } = await context.params;
  const removed = await db.delete(organizationMembers).where(and(
    eq(organizationMembers.id, membershipId), eq(organizationMembers.organizationId, organizationId),
  )).returning({ id: organizationMembers.id });
  if (!removed.length) return Response.json({ error: "Membro não encontrado." }, { status: 404 });
  return new Response(null, { status: 204 });
}
