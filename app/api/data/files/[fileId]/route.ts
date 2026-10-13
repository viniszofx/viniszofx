import { auth } from "@/lib/auth/server";
import { deleteFile, getFile } from "@/lib/storage/server";
import { fileIdPattern } from "@/lib/storage/file-refs";

export const runtime = "nodejs";
type Context = { params: Promise<{ fileId: string }> };

async function scope(context: Context) {
  const [{ data: session }, { fileId }] = await Promise.all([auth.getSession(), context.params]);
  if (!session?.user || !fileIdPattern.test(fileId)) return null;
  return { userId: session.user.id, fileId };
}

export async function GET(_request: Request, context: Context) {
  const value = await scope(context);
  if (!value) return new Response(null, { status: 401 });
  try {
    const object = await getFile(value.userId, value.fileId);
    const body = await object.Body?.transformToByteArray();
    if (!body) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(body), { headers: {
      "Content-Type": object.ContentType || "application/octet-stream",
      "Content-Disposition": "attachment",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") return new Response(null, { status: 404 });
    throw error;
  }
}

export async function DELETE(_request: Request, context: Context) {
  const value = await scope(context);
  if (!value) return new Response(null, { status: 401 });
  await deleteFile(value.userId, value.fileId);
  return new Response(null, { status: 204 });
}
