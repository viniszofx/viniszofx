import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgPosts } from "@/lib/db/schema/app";
import { currentOrganization, unauthorized } from "@/lib/organizations/current";
import { getFile } from "@/lib/storage/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ postId: string }> };

/** Capa do aviso para quem é da mesma organização (rascunho só para quem escreveu). */
export async function GET(_request: Request, context: Context) {
  const [organization, { postId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return unauthorized();
  const [post] = await db.select().from(orgPosts).where(and(eq(orgPosts.id, postId), eq(orgPosts.organizationId, organization.organizationId))).limit(1);
  if (!post?.coverFileId || !post.coverOwnerId || (post.status === "draft" && post.authorId !== organization.userId)) return new Response(null, { status: 404 });
  try {
    const object = await getFile(post.coverOwnerId, post.coverFileId);
    const body = await object.Body?.transformToByteArray();
    if (!body) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(body), { headers: { "Content-Type": object.ContentType || "image/jpeg", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
