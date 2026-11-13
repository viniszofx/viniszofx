import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema/app";
import { sameOrigin } from "@/lib/organizations/guard";

// Limite simples por IP para o formulário público (por instância do servidor).
const hits = new Map<string, number[]>();
function allowed(ip: string) {
  const now = Date.now(); const recent = (hits.get(ip) ?? []).filter(time => now - time < 10 * 60_000);
  if (recent.length >= 5) return false;
  hits.set(ip, [...recent, now]);
  return true;
}
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

/** Captura de lead do botão de conversa da página inicial. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Dados inválidos." }, { status: 400 });
  // Campo isca: pessoas não veem; robôs preenchem.
  if (text(body.website, 200)) return new Response(null, { status: 204 });
  const name = text(body.name, 120); const email = text(body.email, 254).toLowerCase(); const phone = text(body.phone, 40); const message = text(body.message, 4000);
  if (name.length < 2) return Response.json({ error: "Informe seu nome." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Informe um e-mail válido." }, { status: 400 });
  if (phone && phone.replace(/\D/g, "").length < 10) return Response.json({ error: "Informe o telefone com DDD." }, { status: 400 });
  if (message.length < 5) return Response.json({ error: "Escreva sua mensagem." }, { status: 400 });
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (!allowed(ip)) return Response.json({ error: "Muitas mensagens em pouco tempo. Tente de novo em alguns minutos." }, { status: 429 });
  const campaign = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "referrer"].map(key => [key, text((body.campaign as Record<string, unknown> | undefined)?.[key], 300)]).filter(([, value]) => value));
  await db.insert(leads).values({ id: randomUUID(), name, email, phone, message, source: text(body.source, 300) || "/", campaign });
  return new Response(null, { status: 201 });
}
