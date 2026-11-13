import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { moduleSettings } from "@/lib/db/schema/app";
import { appModules } from "@/lib/modules";
import { disabledModules } from "@/lib/modules-server";
import { isPlatformAdmin } from "@/lib/organizations/access";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  return Response.json({ disabled: await disabledModules(), admin: await isPlatformAdmin(session.user.id) }, { headers: { "Cache-Control": "private, no-store" } });
}

/** Só a administração da plataforma liga e desliga módulos, para todas as organizações. */
export async function PATCH(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  if (!await isPlatformAdmin(session.user.id)) return new Response("Somente a administração do sistema altera módulos.", { status: 403 });
  const body = await request.json().catch(() => ({}));
  if (!appModules.some(module => module.key === body.key) || typeof body.enabled !== "boolean") return new Response("Módulo inválido.", { status: 400 });
  await db.insert(moduleSettings).values({ key: body.key, enabled: body.enabled })
    .onConflictDoUpdate({ target: moduleSettings.key, set: { enabled: body.enabled, updatedAt: new Date() } });
  return new Response(null, { status: 204 });
}
