import { createNeonAuth } from "@neondatabase/auth/next/server";

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

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret },
});
