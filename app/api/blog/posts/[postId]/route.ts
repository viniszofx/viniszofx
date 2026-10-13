import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { deleteBlogAsset } from "@/lib/blog/storage";
import { getOwnPost, postSlug } from "@/lib/blog/posts";
import { db } from "@/lib/db";
import { blogAssets, blogPosts } from "@/lib/db/schema/app";

type Context = { params: Promise<{ postId: string }> };

async function ownedPost(context: Context) {
  const [{ data: session }, { postId }] = await Promise.all([auth.getSession(), context.params]);
  if (!session?.user) return null;
  const post = await getOwnPost(postId, session.user.id);
  return post ? { userId: session.user.id, post } : null;
}

export async function GET(_request: Request, context: Context) {
  const scope = await ownedPost(context);
  if (!scope) return new Response(null, { status: 404 });
  return Response.json(scope.post, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request, context: Context) {
  const scope = await ownedPost(context);
  if (!scope) return new Response(null, { status: 404 });
  if (Number(request.headers.get("content-length") ?? 0) > 1_500_000) return new Response("Post muito grande.", { status: 413 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return new Response("JSON inválido.", { status: 400 }); }
  const { title, excerpt, seoTitle, seoDescription, noIndex, adPlacements, content, document, coverAssetId, coverPosition, status } = body;
  if (typeof title !== "string" || title.length > 150 || typeof excerpt !== "string" || excerpt.length > 300 ||
      typeof seoTitle !== "string" || seoTitle.length > 150 || typeof seoDescription !== "string" || seoDescription.length > 300 ||
      typeof noIndex !== "boolean" || !adPlacements || typeof adPlacements !== "object" || Array.isArray(adPlacements) ||
      !["top", "middle", "bottom"].every((key) => typeof (adPlacements as Record<string, unknown>)[key] === "boolean") ||
      typeof content !== "string" || content.length > 200_000 ||
      (document !== null && (typeof document !== "object" || Array.isArray(document))) ||
      (coverAssetId !== null && typeof coverAssetId !== "string") ||
      typeof coverPosition !== "number" || !Number.isInteger(coverPosition) || coverPosition < 0 || coverPosition > 100 ||
      (status !== "draft" && status !== "published")) return new Response("Dados do post inválidos.", { status: 400 });
  if (JSON.stringify(document).length > 1_000_000) return new Response("Documento muito grande.", { status: 413 });
  const trimmedTitle = title.trim();
  if (status === "published" && (!trimmedTitle || !content.trim())) return new Response("Título e conteúdo são obrigatórios para publicar.", { status: 400 });
  if (coverAssetId) {
    const [cover] = await db.select({ id: blogAssets.id }).from(blogAssets)
      .where(and(eq(blogAssets.id, coverAssetId), eq(blogAssets.postId, scope.post.id), eq(blogAssets.authorId, scope.userId))).limit(1);
    if (!cover) return new Response("Capa inválida.", { status: 400 });
  }
  const publishedAt = status === "published" ? scope.post.publishedAt ?? new Date() : null;
  const [updated] = await db.update(blogPosts).set({
    title: trimmedTitle, excerpt: excerpt.trim(), seoTitle: seoTitle.trim(), seoDescription: seoDescription.trim(),
    noIndex, adPlacements: adPlacements as { top: boolean; middle: boolean; bottom: boolean }, content,
    document: document as Record<string, unknown> | null,
    coverAssetId: coverAssetId as string | null, coverPosition, status,
    slug: status === "published" ? scope.post.slug ?? postSlug(trimmedTitle, scope.post.id) : scope.post.slug,
    publishedAt, updatedAt: new Date(),
  }).where(and(eq(blogPosts.id, scope.post.id), eq(blogPosts.authorId, scope.userId))).returning();
  return Response.json(updated);
}

export async function DELETE(_request: Request, context: Context) {
  const scope = await ownedPost(context);
  if (!scope) return new Response(null, { status: 404 });
  const assets = await db.select({ id: blogAssets.id }).from(blogAssets).where(eq(blogAssets.postId, scope.post.id));
  await db.delete(blogPosts).where(and(eq(blogPosts.id, scope.post.id), eq(blogPosts.authorId, scope.userId)));
  await Promise.allSettled(assets.map((asset) => deleteBlogAsset(scope.userId, scope.post.id, asset.id)));
  return new Response(null, { status: 204 });
}
