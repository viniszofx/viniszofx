import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema/app";
import { listOwnPosts } from "@/lib/blog/posts";
import { canWriteOrganizationData } from "@/lib/organizations/access";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  return Response.json(await listOwnPosts(session.user.id), { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  if (!await canWriteOrganizationData(session.user.id)) return new Response("Acesso externo é somente leitura.", { status: 403 });
  const id = randomUUID();
  await db.insert(blogPosts).values({ id, authorId: session.user.id });
  return Response.json({ id }, { status: 201 });
}
