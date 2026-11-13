import { and, eq, isNull } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db, isLocalAuth } from "@/lib/db";
import { localAuthAccount, localAuthSession } from "@/lib/db/schema/auth";
import { passwordRequests } from "@/lib/db/schema/app";
import { requirePlatformAdmin, sameOrigin } from "@/lib/organizations/guard";

type Context = { params: Promise<{ userId: string }> };

/** A administração define uma senha nova; as sessões abertas da pessoa são encerradas. */
export async function POST(request: Request, context: Context) {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  if (!isLocalAuth) return Response.json({ error: "No Neon Auth a pessoa redefine a senha pelo link enviado por e-mail." }, { status: 400 });
  const { userId } = await context.params;
  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 8 || password.length > 128) return Response.json({ error: "A senha deve ter entre 8 e 128 caracteres." }, { status: 400 });
  const updated = await db.update(localAuthAccount).set({ password: await hashPassword(password), updatedAt: new Date() })
    .where(and(eq(localAuthAccount.userId, userId), eq(localAuthAccount.providerId, "credential"))).returning({ id: localAuthAccount.id });
  if (!updated.length) return Response.json({ error: "Conta com senha não encontrada." }, { status: 404 });
  await db.delete(localAuthSession).where(eq(localAuthSession.userId, userId));
  await db.update(passwordRequests).set({ resolvedAt: new Date() }).where(and(eq(passwordRequests.userId, userId), isNull(passwordRequests.resolvedAt)));
  return new Response(null, { status: 204 });
}
