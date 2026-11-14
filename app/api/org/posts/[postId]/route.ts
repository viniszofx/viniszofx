import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgPostVotes, orgPosts } from "@/lib/db/schema/app";
import { canWrite, currentOrganization, readOnly, unauthorized } from "@/lib/organizations/current";
import { parsePost } from "@/lib/organizations/posts";
import { deleteFile } from "@/lib/storage/server";

type Context = { params: Promise<{ postId: string }> };

async function ownPost(context: Context) {
  const [organization, { postId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return { error: unauthorized() } as const;
  const [post] = await db.select().from(orgPosts).where(and(eq(orgPosts.id, postId), eq(orgPosts.organizationId, organization.organizationId))).limit(1);
  if (!post) return { error: new Response("Aviso não encontrado.", { status: 404 }) } as const;
  // Quem publicou ou a administração edita e exclui.
  if (!canWrite(organization) || (post.authorId !== organization.userId && !organization.admin)) return { error: readOnly() } as const;
  return { post, organization } as const;
}

const dropCover = (post: typeof orgPosts.$inferSelect) => post.coverFileId && post.coverOwnerId ? deleteFile(post.coverOwnerId, post.coverFileId).catch(() => undefined) : undefined;

export async function PATCH(request: Request, context: Context) {
  const result = await ownPost(context);
  if ("error" in result) return result.error;
  const { post, organization } = result;
  const parsed = parsePost(await request.json().catch(() => ({})));
  if ("error" in parsed) return new Response(parsed.error, { status: 400 });
  // Mesma capa: mantém o dono; capa nova: é de quem está editando.
  const sameCover = parsed.coverFileId === post.coverFileId;
  const cover = sameCover ? { coverFileId: post.coverFileId, coverOwnerId: post.coverOwnerId } : { coverFileId: parsed.coverFileId, coverOwnerId: parsed.coverFileId ? organization.userId : null };
  await db.update(orgPosts).set({ ...parsed.value, ...cover, updatedAt: new Date() }).where(eq(orgPosts.id, post.id));
  if (!sameCover) await dropCover(post);
  // Opções removidas da enquete levam os votos junto.
  const kept = parsed.value.poll?.options.map(option => option.id) ?? [];
  await db.delete(orgPostVotes).where(kept.length ? and(eq(orgPostVotes.postId, post.id), notInArray(orgPostVotes.optionId, kept)) : eq(orgPostVotes.postId, post.id));
  return new Response(null, { status: 204 });
}

export async function DELETE(_request: Request, context: Context) {
  const result = await ownPost(context);
  if ("error" in result) return result.error;
  await db.delete(orgPosts).where(eq(orgPosts.id, result.post.id));
  await dropCover(result.post);
  return new Response(null, { status: 204 });
}
