import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema/app";
import { deleteFile, putFile } from "@/lib/storage/server";

export const runtime = "nodejs";
const types = ["image/png", "image/jpeg", "image/webp"];

/** Envia a foto de perfil (já recortada no navegador, até 5 MB) e devolve o endereço dela. */
export async function POST(request: Request) {
  const { data } = await auth.getRawSession();
  if (!data?.user) return Response.json({ error: "Sua sessão expirou." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !types.includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) return Response.json({ error: "Envie uma imagem PNG, JPG ou WebP de até 5 MB." }, { status: 400 });
  const fileId = randomUUID();
  await putFile(data.user.id, fileId, file);
  const [previous] = await db.select({ avatarFileId: userProfiles.avatarFileId }).from(userProfiles).where(eq(userProfiles.userId, data.user.id)).limit(1);
  await db.insert(userProfiles).values({ userId: data.user.id, avatarFileId: fileId, updatedAt: new Date() })
    .onConflictDoUpdate({ target: userProfiles.userId, set: { avatarFileId: fileId, updatedAt: new Date() } });
  if (previous?.avatarFileId) await deleteFile(data.user.id, previous.avatarFileId).catch(() => undefined);
  return Response.json({ url: `/api/profile/avatar/${data.user.id}?v=${fileId.slice(0, 8)}` });
}

/** Remove a foto de perfil. */
export async function DELETE() {
  const { data } = await auth.getRawSession();
  if (!data?.user) return Response.json({ error: "Sua sessão expirou." }, { status: 401 });
  const [previous] = await db.select({ avatarFileId: userProfiles.avatarFileId }).from(userProfiles).where(eq(userProfiles.userId, data.user.id)).limit(1);
  await db.update(userProfiles).set({ avatarFileId: null, updatedAt: new Date() }).where(eq(userProfiles.userId, data.user.id));
  if (previous?.avatarFileId) await deleteFile(data.user.id, previous.avatarFileId).catch(() => undefined);
  return new Response(null, { status: 204 });
}
