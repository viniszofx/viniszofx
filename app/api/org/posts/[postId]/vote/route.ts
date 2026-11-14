import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgPostVotes, orgPosts } from "@/lib/db/schema/app";
import { currentOrganization, readOnly, unauthorized } from "@/lib/organizations/current";

type Context = { params: Promise<{ postId: string }> };

/** Registra o voto de quem está logado (substitui o anterior). Lista vazia retira o voto. */
export async function PUT(request: Request, context: Context) {
  const [organization, { postId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return unauthorized();
  if (organization.role === "external" && !organization.admin) return readOnly();
  const [post] = await db.select().from(orgPosts).where(and(eq(orgPosts.id, postId), eq(orgPosts.organizationId, organization.organizationId))).limit(1);
  const now = new Date();
  if (!post?.poll || post.status !== "published" || (post.publishAt && post.publishAt > now)) return new Response("Enquete não encontrada.", { status: 404 });
  if ((post.poll.closesAt && new Date(post.poll.closesAt) <= now) || (post.expiresAt && post.expiresAt <= now)) return new Response("A enquete já foi encerrada.", { status: 409 });
  const body = await request.json().catch(() => ({}));
  const valid = new Set(post.poll.options.map(option => option.id));
  const picked: unknown[] = Array.isArray(body.options) ? body.options : [];
  const chosen = [...new Set(picked.filter((id): id is string => typeof id === "string" && valid.has(id)))];
  if (!post.poll.multiple && chosen.length > 1) return new Response("Escolha só uma opção.", { status: 400 });
  // Sem transação: o driver HTTP do Neon não tem; trocar o voto é apagar e gravar de novo.
  await db.delete(orgPostVotes).where(and(eq(orgPostVotes.postId, post.id), eq(orgPostVotes.userId, organization.userId)));
  if (chosen.length) await db.insert(orgPostVotes).values(chosen.map(optionId => ({ postId: post.id, userId: organization.userId, optionId }))).onConflictDoNothing();
  return new Response(null, { status: 204 });
}
