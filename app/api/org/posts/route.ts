import { randomUUID } from "node:crypto";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { parsePost } from "@/lib/organizations/posts";
import { db } from "@/lib/db";
import { orgPostComments, orgPostVotes, orgPosts } from "@/lib/db/schema/app";
import { canWrite, currentOrganization, readOnly, unauthorized, userNames } from "@/lib/organizations/current";

/** Mural da organização: avisos com quem publicou, comentários, capa e resultado das enquetes. */
export async function GET() {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  const posts = await db.select().from(orgPosts).where(eq(orgPosts.organizationId, context.organizationId)).orderBy(desc(orgPosts.createdAt)).limit(300);
  // Rascunhos só aparecem para quem escreveu.
  const visible = posts.filter(post => post.status === "published" || post.authorId === context.userId);
  const ids = visible.map(post => post.id);
  const pollIds = visible.filter(post => post.poll).map(post => post.id);
  const [counts, votes] = await Promise.all([
    ids.length ? db.select({ postId: orgPostComments.postId, count: sql<number>`count(*)::int` }).from(orgPostComments).where(inArray(orgPostComments.postId, ids)).groupBy(orgPostComments.postId) : [],
    pollIds.length ? db.select({ postId: orgPostVotes.postId, userId: orgPostVotes.userId, optionId: orgPostVotes.optionId }).from(orgPostVotes).where(inArray(orgPostVotes.postId, pollIds)) : [],
  ]);
  const names = await userNames(visible.map(post => post.authorId));
  return Response.json({
    organization: { id: context.organizationId, name: context.organizationName }, me: context.userId, canWrite: canWrite(context), admin: context.admin,
    posts: visible.map(({ coverOwnerId: _owner, ...post }) => {
      const mine = votes.filter(vote => vote.postId === post.id);
      return {
        ...post, authorName: names.get(post.authorId) ?? "Pessoa removida", comments: counts.find(item => item.postId === post.id)?.count ?? 0,
        cover: post.coverFileId ? `/api/org/posts/${post.id}/cover?v=${post.coverFileId.slice(0, 8)}` : null,
        poll: post.poll ? {
          ...post.poll,
          voters: new Set(mine.map(vote => vote.userId)).size,
          counts: Object.fromEntries(post.poll.options.map(option => [option.id, mine.filter(vote => vote.optionId === option.id).length])),
          mine: mine.filter(vote => vote.userId === context.userId).map(vote => vote.optionId),
        } : null,
      };
    }),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  if (!canWrite(context)) return readOnly();
  const parsed = parsePost(await request.json().catch(() => ({})));
  if ("error" in parsed) return new Response(parsed.error, { status: 400 });
  const id = randomUUID();
  // A capa nova sempre está no storage de quem cria o aviso.
  await db.insert(orgPosts).values({ id, organizationId: context.organizationId, authorId: context.userId, ...parsed.value, coverFileId: parsed.coverFileId, coverOwnerId: parsed.coverFileId ? context.userId : null });
  return Response.json({ id }, { status: 201 });
}
