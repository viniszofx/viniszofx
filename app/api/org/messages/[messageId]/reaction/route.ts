import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages, messageReactions } from "@/lib/db/schema/app";
import { currentOrganization, unauthorized } from "@/lib/organizations/current";
import { notExpired } from "@/lib/organizations/messages";

type Context = { params: Promise<{ messageId: string }> };

/** Só quem enviou ou recebeu a mensagem reage a ela. */
async function reachable(context: Context) {
  const [organization, { messageId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return { error: unauthorized() } as const;
  const [message] = await db.select({ id: directMessages.id }).from(directMessages).where(and(eq(directMessages.id, messageId), eq(directMessages.organizationId, organization.organizationId), isNull(directMessages.deletedAt), notExpired(),
    or(eq(directMessages.senderId, organization.userId), eq(directMessages.recipientId, organization.userId)))).limit(1);
  if (!message) return { error: new Response("Mensagem não encontrada.", { status: 404 }) } as const;
  return { messageId: message.id, userId: organization.userId } as const;
}

/** Reagir (troca a reação anterior: uma por pessoa). */
export async function PUT(request: Request, context: Context) {
  const result = await reachable(context);
  if ("error" in result) return result.error;
  const body = await request.json().catch(() => ({}));
  const emoji = typeof body.emoji === "string" ? body.emoji.trim() : "";
  // Um emoji (pode ter modificadores e junções): sem texto comum.
  if (!emoji || emoji.length > 16 || /[\p{L}\p{N}\s]/u.test(emoji)) return new Response("Escolha um emoji.", { status: 400 });
  await db.insert(messageReactions).values({ messageId: result.messageId, userId: result.userId, emoji })
    .onConflictDoUpdate({ target: [messageReactions.messageId, messageReactions.userId], set: { emoji, createdAt: new Date() } });
  return new Response(null, { status: 204 });
}

/** Tirar a própria reação. */
export async function DELETE(_request: Request, context: Context) {
  const result = await reachable(context);
  if ("error" in result) return result.error;
  await db.delete(messageReactions).where(and(eq(messageReactions.messageId, result.messageId), eq(messageReactions.userId, result.userId)));
  return new Response(null, { status: 204 });
}
