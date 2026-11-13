import { and, eq, isNull } from "drizzle-orm";
import { db, isLocalAuth } from "@/lib/db";
import { localAuthUser } from "@/lib/db/schema/auth";
import { passwordRequests } from "@/lib/db/schema/app";
import { sameOrigin } from "@/lib/organizations/guard";

/**
 * "Esqueci a senha" no modo local: registra o pedido para a administração.
 * Responde sempre igual, para não revelar quais e-mails têm conta.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  if (!isLocalAuth) return Response.json({ error: "Use o link enviado por e-mail." }, { status: 400 });
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Informe um e-mail válido." }, { status: 400 });
  const [user] = await db.select({ id: localAuthUser.id }).from(localAuthUser).where(eq(localAuthUser.email, email)).limit(1);
  if (user) {
    const [open] = await db.select({ id: passwordRequests.id }).from(passwordRequests).where(and(eq(passwordRequests.userId, user.id), isNull(passwordRequests.resolvedAt))).limit(1);
    if (!open) await db.insert(passwordRequests).values({ id: crypto.randomUUID(), userId: user.id, email });
  }
  return new Response(null, { status: 204 });
}
