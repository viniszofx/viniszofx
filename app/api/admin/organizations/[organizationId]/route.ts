import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema/app";
import { requirePlatformAdmin, sameOrigin } from "@/lib/organizations/guard";

type Context = { params: Promise<{ organizationId: string }> };

export async function PATCH(request: Request, context: Context) {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { organizationId } = await context.params;
  const body = await request.json().catch(() => null) as { name?: unknown; status?: unknown } | null;
  const values: { name?: string; status?: "active" | "suspended"; updatedAt: Date } = { updatedAt: new Date() };
  if (body?.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 80) {
      return Response.json({ error: "O nome deve ter entre 2 e 80 caracteres." }, { status: 400 });
    }
    values.name = body.name.trim();
  }
  if (body?.status !== undefined) {
    if (body.status !== "active" && body.status !== "suspended") return Response.json({ error: "Status inválido." }, { status: 400 });
    values.status = body.status;
  }
  if (Object.keys(values).length === 1) return Response.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  const [organization] = await db.update(organizations).set(values).where(eq(organizations.id, organizationId))
    .returning({ id: organizations.id, name: organizations.name, slug: organizations.slug, status: organizations.status });
  if (!organization) return Response.json({ error: "Organização não encontrada." }, { status: 404 });
  return Response.json(organization);
}
