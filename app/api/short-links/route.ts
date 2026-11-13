import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { shortLinks } from "@/lib/db/schema/app";

const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
const newCode = () => Array.from(randomBytes(7), byte => alphabet[byte % alphabet.length]).join("");
// Só caminhos públicos do próprio site viram link curto.
const allowed = /^\/(arquivo|quadro|diagrama)\/[0-9a-f-]{36}$/;

/** Cria (ou reaproveita) o link curto /s/<código> para um link público. */
export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const target = typeof body.target === "string" ? body.target : "";
  if (!allowed.test(target)) return new Response("Link inválido.", { status: 400 });
  const [existing] = await db.select({ code: shortLinks.code }).from(shortLinks).where(and(eq(shortLinks.ownerId, session.user.id), eq(shortLinks.target, target))).limit(1);
  if (existing) return Response.json({ code: existing.code });
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const inserted = await db.insert(shortLinks).values({ code, ownerId: session.user.id, target }).onConflictDoNothing().returning({ code: shortLinks.code });
    if (inserted.length) return Response.json({ code }, { status: 201 });
  }
  return new Response("Tente novamente.", { status: 503 });
}
