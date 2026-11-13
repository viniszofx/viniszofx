import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema/app";
import { requirePlatformAdmin, sameOrigin } from "@/lib/organizations/guard";

export async function GET() {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  const rows = await db.select({
    id: organizations.id,
    name: organizations.name,
    slug: organizations.slug,
    status: organizations.status,
    createdAt: organizations.createdAt,
    memberCount: count(organizationMembers.id),
  }).from(organizations).leftJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
    .groupBy(organizations.id).orderBy(desc(organizations.createdAt));
  return Response.json(rows, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const body = await request.json().catch(() => null) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) return Response.json({ error: "O nome deve ter entre 2 e 80 caracteres." }, { status: 400 });
  const slugBase = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "organizacao";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const [organization] = await db.insert(organizations).values({
    id: crypto.randomUUID(), name, slug, createdBy: access.userId!,
  }).returning({ id: organizations.id, name: organizations.name, slug: organizations.slug, status: organizations.status });
  return Response.json(organization, { status: 201 });
}
