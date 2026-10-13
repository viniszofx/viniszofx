import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.AUTH_NEON_URL;
const secret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl) throw new Error("AUTH_NEON_URL não configurada.");
if (!secret || secret.length < 32) throw new Error("NEON_AUTH_COOKIE_SECRET deve ter pelo menos 32 caracteres.");

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret },
});
