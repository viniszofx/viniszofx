import { createNeonAuth } from "@neondatabase/auth/next/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { db, isLocalAuth } from "@/lib/db";
import { localAuthSchema } from "@/lib/db/schema/auth";
import { hasOrganizationAccess, isPlatformAdmin } from "@/lib/organizations/access";

function createLocalAuth() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET deve ter pelo menos 32 caracteres.");
  return betterAuth({
    appName: "VinisZofx",
    baseURL: process.env.AUTH_BASE_URL || "http://localhost:3000",
    secret,
    trustedOrigins: ["http://localhost:3000"],
    database: drizzleAdapter(db, { provider: "pg", schema: localAuthSchema }),
    emailAndPassword: { enabled: true },
  });
}

function createHostedAuth() {
  // Neon/Vercel injects NEON_AUTH_BASE_URL for each deployment branch.
  // AUTH_NEON_URL remains a fallback for manually configured environments.
  const baseUrl = (process.env.NEON_AUTH_BASE_URL || process.env.AUTH_NEON_URL)?.trim().replace(/\/$/, "");
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl) throw new Error("NEON_AUTH_BASE_URL ou AUTH_NEON_URL não configurada.");
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("protocolo inválido");
    if (!url.pathname.endsWith("/auth")) throw new Error("caminho inválido");
  } catch {
    throw new Error("URL do Neon Auth inválida. Use o endpoint que termina em /auth, não a JWKS_URL.");
  }
  if (!secret || secret.length < 32) throw new Error("NEON_AUTH_COOKIE_SECRET deve ter pelo menos 32 caracteres.");
  return createNeonAuth({ baseUrl, cookies: { secret } });
}

const localAuth = isLocalAuth ? createLocalAuth() : null;
export const hostedAuth = isLocalAuth ? null : createHostedAuth();

export const auth = {
  getRawSession: async () => {
    if (localAuth) return { data: await localAuth.api.getSession({ headers: await headers() }) };
    return hostedAuth!.getSession();
  },
  getSession: async () => {
    const result = await auth.getRawSession();
    const userId = result.data?.user.id;
    if (!userId || await isPlatformAdmin(userId) || await hasOrganizationAccess(userId)) return result;
    return { data: null };
  },
};

type AuthContext = { params: Promise<{ path: string[] }> };

export async function handleAuthGet(request: Request, context: AuthContext) {
  if (localAuth) return localAuth.handler(request);
  return hostedAuth!.handler().GET(request, context);
}

export async function handleAuthPost(request: Request, context: AuthContext) {
  if (localAuth) return localAuth.handler(request);
  return hostedAuth!.handler().POST(request, context);
}
