import { NextRequest, NextResponse } from "next/server";
import { hostedAuth } from "@/lib/auth/server";
import { isLocalAuth } from "@/lib/db";
import { disabledModuleForApi } from "@/lib/modules";
import { disabledModules } from "@/lib/modules-server";

const hostedMiddleware = hostedAuth?.middleware({ loginUrl: "/login" });

// Módulos desligados em Sistema › Módulos, lidos no máximo a cada 10 s.
let cache: { keys: string[]; expires: number } | null = null;
async function disabled() {
  if (cache && cache.expires > Date.now()) return cache.keys;
  try { cache = { keys: await disabledModules(), expires: Date.now() + 10_000 }; }
  catch { cache = { keys: cache?.keys ?? [], expires: Date.now() + 2_000 }; }
  return cache.keys;
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // APIs e páginas públicas de módulos desligados param aqui (as páginas do painel mostram o aviso no próprio shell).
  if (!path.startsWith("/dashboard")) {
    const blocked = disabledModuleForApi(path, await disabled());
    if (blocked) {
      if (path.startsWith("/api/")) return NextResponse.json({ error: `${blocked.name} está desativado pela administração.` }, { status: 403 });
      return NextResponse.rewrite(new URL(`/indisponivel?modulo=${encodeURIComponent(blocked.name)}`, request.url));
    }
    return NextResponse.next();
  }
  if (isLocalAuth) return NextResponse.next();
  return hostedMiddleware!(request);
}

export const config = { matcher: ["/dashboard/:path*", "/api/:path*", "/blog", "/blog/:path*", "/quadro/:path*", "/diagrama/:path*", "/arquivo/:path*", "/s/:path*"] };
