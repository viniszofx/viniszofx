import { randomUUID } from "node:crypto";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { parsePost } from "@/lib/organizations/posts";
import { db } from "@/lib/db";
import { orgPostComments, orgPosts } from "@/lib/db/schema/app";
import { canWrite, currentOrganization, readOnly, unauthorized, userNames } from "@/lib/organizations/current";

/** Mural da organização: avisos com quem publicou e quantos comentários há. */
export async function GET() {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  const posts = await db.select().from(orgPosts).where(eq(orgPosts.organizationId, context.organizationId)).orderBy(desc(orgPosts.createdAt)).limit(300);
  // Rascunhos só aparecem para quem escreveu.
  const visible = posts.filter(post => post.status === "published" || post.authorId === context.userId);
  const ids = visible.map(post => post.id);
  const counts = ids.length ? await db.select({ postId: orgPostComments.postId, count: sql<number>`count(*)::int` }).from(orgPostComments).where(inArray(orgPostComments.postId, ids)).groupBy(orgPostComments.postId) : [];
  const names = await userNames(visible.map(post => post.authorId));
  return Response.json({
    organization: { id: context.organizationId, name: context.organizationName }, me: context.userId, canWrite: canWrite(context), admin: context.admin,
    posts: visible.map(post => ({ ...post, authorName: names.get(post.authorId) ?? "Pessoa removida", comments: counts.find(item => item.postId === post.id)?.count ?? 0 })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  if (!canWrite(context)) return readOnly();
  const parsed = parsePost(await request.json().catch(() => ({})));
  if ("error" in parsed) return new Response(parsed.error, { status: 400 });
  const id = randomUUID();
  await db.insert(orgPosts).values({ id, organizationId: context.organizationId, authorId: context.userId, ...parsed.value });
  return Response.json({ id }, { status: 201 });
}

