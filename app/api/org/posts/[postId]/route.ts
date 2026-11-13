import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgPosts } from "@/lib/db/schema/app";
import { canWrite, currentOrganization, readOnly, unauthorized } from "@/lib/organizations/current";
import { parsePost } from "@/lib/organizations/posts";

type Context = { params: Promise<{ postId: string }> };

async function ownPost(context: Context) {
  const [organization, { postId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return { error: unauthorized() } as const;
  const [post] = await db.select().from(orgPosts).where(and(eq(orgPosts.id, postId), eq(orgPosts.organizationId, organization.organizationId))).limit(1);
  if (!post) return { error: new Response("Aviso não encontrado.", { status: 404 }) } as const;
  // Quem publicou ou a administração edita e exclui.
  if (!canWrite(organization) || (post.authorId !== organization.userId && !organization.admin)) return { error: readOnly() } as const;
  return { post } as const;
}

export async function PATCH(request: Request, context: Context) {
  const result = await ownPost(context);
  if ("error" in result) return result.error;
  const parsed = parsePost(await request.json().catch(() => ({})));
  if ("error" in parsed) return new Response(parsed.error, { status: 400 });
  await db.update(orgPosts).set({ ...parsed.value, updatedAt: new Date() }).where(eq(orgPosts.id, result.post.id));
  return new Response(null, { status: 204 });
}

export async function DELETE(_request: Request, context: Context) {
  const result = await ownPost(context);
  if ("error" in result) return result.error;
  await db.delete(orgPosts).where(eq(orgPosts.id, result.post.id));
  return new Response(null, { status: 204 });
}
