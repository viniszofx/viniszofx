import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getBlogAsset } from "@/lib/blog/storage";
import { db } from "@/lib/db";
import { blogAssets, blogPosts } from "@/lib/db/schema/app";
import { fileIdPattern } from "@/lib/storage/file-refs";

export const runtime = "nodejs";
type Context = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, context: Context) {
  const { assetId } = await context.params;
  if (!fileIdPattern.test(assetId)) return new Response(null, { status: 404 });
  const [record] = await db.select({ asset: blogAssets, status: blogPosts.status }).from(blogAssets)
    .innerJoin(blogPosts, eq(blogPosts.id, blogAssets.postId))
    .where(and(eq(blogAssets.id, assetId), eq(blogAssets.authorId, blogPosts.authorId))).limit(1);
  if (!record) return new Response(null, { status: 404 });
  if (record.status !== "published") {
    const { data: session } = await auth.getSession();
    if (session?.user?.id !== record.asset.authorId) return new Response(null, { status: 404 });
  }
  try {
    const object = await getBlogAsset(record.asset.authorId, record.asset.postId, record.asset.id);
    const body = await object.Body?.transformToByteArray();
    if (!body) return new Response(null, { status: 404 });
    const inline = record.asset.contentType.startsWith("image/");
    return new Response(new Uint8Array(body), { headers: {
      "Content-Type": record.asset.contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(record.asset.name)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") return new Response(null, { status: 404 });
    throw error;
  }
}
