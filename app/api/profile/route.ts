import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema/app";

export async function GET() {
  const { data } = await auth.getSession();
  if (!data?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, data.user.id)).limit(1);
  return NextResponse.json({ username: profile?.username ?? "", bio: profile?.bio ?? "" });
}

export async function PATCH(request: Request) {
  const { data } = await auth.getSession();
  if (!data?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null) as { username?: unknown; bio?: unknown } | null;
  if (!body || typeof body.username !== "string" || typeof body.bio !== "string") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const username = body.username.trim().replace(/^@/, "").toLowerCase();
  const bio = body.bio.trim();
  if (username.length < 3 || username.length > 30 || !/^[a-z0-9._]+$/.test(username)) {
    return NextResponse.json({ error: "Use de 3 a 30 caracteres: letras, números, ponto ou sublinhado." }, { status: 400 });
  }
  if (bio.length > 240) return NextResponse.json({ error: "A bio pode ter até 240 caracteres." }, { status: 400 });
  try {
    await db.insert(userProfiles).values({ userId: data.user.id, username, bio, updatedAt: new Date() })
      .onConflictDoUpdate({ target: userProfiles.userId, set: { username, bio, updatedAt: new Date() } });
    return NextResponse.json({ username, bio });
  } catch {
    return NextResponse.json({ error: "Esse nome de usuário já está em uso." }, { status: 409 });
  }
}
