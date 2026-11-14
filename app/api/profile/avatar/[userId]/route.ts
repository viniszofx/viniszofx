import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema/app";
import { getFile } from "@/lib/storage/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ userId: string }> };

/** Foto de perfil de uma conta, para quem está logado (mensagens, membros, cabeçalho). */
export async function GET(_request: Request, context: Context) {
  const [{ data }, { userId }] = await Promise.all([auth.getRawSession(), context.params]);
  if (!data?.user) return new Response(null, { status: 401 });
  const [profile] = await db.select({ avatarFileId: userProfiles.avatarFileId }).from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (!profile?.avatarFileId) return new Response(null, { status: 404 });
  try {
    const object = await getFile(userId, profile.avatarFileId);
    const body = await object.Body?.transformToByteArray();
    if (!body) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(body), { headers: { "Content-Type": object.ContentType || "image/jpeg", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
