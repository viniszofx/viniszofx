import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isPlatformAdmin } from "@/lib/organizations/access";

export async function requirePlatformAdmin() {
  const { data } = await auth.getSession();
  if (!data?.user) return { userId: null, response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  if (!await isPlatformAdmin(data.user.id)) {
    return { userId: null, response: NextResponse.json({ error: "Acesso restrito ao administrador da aplicação." }, { status: 403 }) };
  }
  return { userId: data.user.id, response: null };
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}
