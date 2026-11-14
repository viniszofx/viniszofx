import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages } from "@/lib/db/schema/app";
import { currentOrganization, unauthorized } from "@/lib/organizations/current";
import { getFile } from "@/lib/storage/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ messageId: string; fileId: string }> };

/** Baixa um anexo: só quem enviou ou recebeu a mensagem. Imagens abrem no navegador. */
export async function GET(_request: Request, context: Context) {
  const [organization, { messageId, fileId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return unauthorized();
  const [message] = await db.select().from(directMessages).where(and(eq(directMessages.id, messageId), eq(directMessages.organizationId, organization.organizationId),
    or(eq(directMessages.senderId, organization.userId), eq(directMessages.recipientId, organization.userId)))).limit(1);
  const attachment = message?.attachments.find(item => item.fileId === fileId);
  if (!message || !attachment) return new Response(null, { status: 404 });
  try {
    const object = await getFile(attachment.ownerId ?? message.senderId, fileId);
    const body = await object.Body?.transformToByteArray();
    if (!body) return new Response(null, { status: 404 });
    const image = /^image\/(png|jpe?g|gif|webp|avif)$/.test(attachment.type);
    return new Response(new Uint8Array(body), { headers: {
      "Content-Type": image ? attachment.type : "application/octet-stream",
      "Content-Disposition": `${image ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
      "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") return new Response(null, { status: 404 });
    throw error;
  }
}
