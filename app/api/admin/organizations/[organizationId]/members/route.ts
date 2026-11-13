import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema/app";
import { authUsers, localAuthUser } from "@/lib/db/schema/auth";
import { organizationMemberRows } from "@/lib/organizations/access";
import { requirePlatformAdmin, sameOrigin } from "@/lib/organizations/guard";
import { isLocalAuth } from "@/lib/db";

type Context = { params: Promise<{ organizationId: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  const { organizationId } = await context.params;
  const [organization] = await db.select({ id: organizations.id, name: organizations.name, slug: organizations.slug, status: organizations.status })
    .from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  if (!organization) return Response.json({ error: "Organização não encontrada." }, { status: 404 });
  return Response.json({ organization, members: await organizationMemberRows(organizationId) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request, context: Context) {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const { organizationId } = await context.params;
  const body = await request.json().catch(() => null) as { email?: unknown; role?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role === "external" ? "external" : body?.role === "member" ? "member" : null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !role) return Response.json({ error: "Informe um e-mail válido e uma função." }, { status: 400 });
  const [organization] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  if (!organization) return Response.json({ error: "Organização não encontrada." }, { status: 404 });
  const [user] = isLocalAuth
    ? await db.select({ id: localAuthUser.id }).from(localAuthUser).where(eq(localAuthUser.email, email)).limit(1)
    : await db.select({ id: authUsers.id }).from(authUsers).where(eq(authUsers.email, email)).limit(1);
  if (!user) return Response.json({ error: "Essa pessoa ainda não possui uma conta. Peça que ela se cadastre primeiro." }, { status: 404 });
  const id = crypto.randomUUID();
  const [member] = await db.insert(organizationMembers).values({ id, organizationId, userId: user.id, role }).onConflictDoNothing()
    .returning({ id: organizationMembers.id, userId: organizationMembers.userId, role: organizationMembers.role, status: organizationMembers.status });
  if (!member) return Response.json({ error: "Essa conta já está vinculada a esta organização." }, { status: 409 });
  return Response.json(member, { status: 201 });
}
