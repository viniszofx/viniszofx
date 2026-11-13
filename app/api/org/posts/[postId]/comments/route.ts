import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgPostComments, orgPosts } from "@/lib/db/schema/app";
import { currentOrganization, unauthorized, userNames } from "@/lib/organizations/current";

type Context = { params: Promise<{ postId: string }> };

async function visiblePost(context: Context) {
  const [organization, { postId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return null;
  const [post] = await db.select({ id: orgPosts.id, status: orgPosts.status, authorId: orgPosts.authorId }).from(orgPosts)
    .where(and(eq(orgPosts.id, postId), eq(orgPosts.organizationId, organization.organizationId))).limit(1);
  if (!post || (post.status === "draft" && post.authorId !== organization.userId)) return { organization, post: null };
  return { organization, post };
}

/** Discussão do aviso (Nodus: mural com discussão). Membros e externos podem comentar. */
export async function GET(_request: Request, context: Context) {
  const scope = await visiblePost(context);
  if (!scope) return unauthorized();
  if (!scope.post) return new Response(null, { status: 404 });
  const comments = await db.select().from(orgPostComments).where(eq(orgPostComments.postId, scope.post.id)).orderBy(asc(orgPostComments.createdAt));
  const names = await userNames(comments.map(comment => comment.authorId));
  return Response.json({ comments: comments.map(comment => ({ ...comment, authorName: names.get(comment.authorId) ?? "Pessoa removida", mine: comment.authorId === scope.organization.userId })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request, context: Context) {
  const scope = await visiblePost(context);
  if (!scope) return unauthorized();
  if (!scope.post) return new Response(null, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 5000) : "";
  if (!text) return new Response("Escreva o comentário.", { status: 400 });
  await db.insert(orgPostComments).values({ id: randomUUID(), postId: scope.post.id, authorId: scope.organization.userId, body: text });
  return new Response(null, { status: 201 });
}

export async function DELETE(request: Request, context: Context) {
  const scope = await visiblePost(context);
  if (!scope) return unauthorized();
  if (!scope.post) return new Response(null, { status: 404 });
  const id = new URL(request.url).searchParams.get("comment") ?? "";
  const [comment] = await db.select({ authorId: orgPostComments.authorId }).from(orgPostComments).where(and(eq(orgPostComments.id, id), eq(orgPostComments.postId, scope.post.id))).limit(1);
  if (!comment) return new Response(null, { status: 404 });
  if (comment.authorId !== scope.organization.userId && !scope.organization.admin && scope.post.authorId !== scope.organization.userId) return new Response("Só quem comentou pode excluir.", { status: 403 });
  await db.delete(orgPostComments).where(eq(orgPostComments.id, id));
  return new Response(null, { status: 204 });
}
