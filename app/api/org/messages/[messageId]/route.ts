import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { directMessages } from "@/lib/db/schema/app";
import { currentOrganization, unauthorized } from "@/lib/organizations/current";
import { deleteFile } from "@/lib/storage/server";

type Context = { params: Promise<{ messageId: string }> };

async function ownMessage(context: Context) {
  const [organization, { messageId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return { error: unauthorized() } as const;
  const [message] = await db.select().from(directMessages).where(and(eq(directMessages.id, messageId), eq(directMessages.organizationId, organization.organizationId), isNull(directMessages.deletedAt))).limit(1);
  if (!message) return { error: new Response("Mensagem não encontrada.", { status: 404 }) } as const;
  if (message.senderId !== organization.userId) return { error: new Response("Só quem enviou pode alterar a mensagem.", { status: 403 }) } as const;
  return { message } as const;
}

/** Editar o texto da própria mensagem. */
export async function PATCH(request: Request, context: Context) {
  const result = await ownMessage(context);
  if ("error" in result) return result.error;
  const body = await request.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text && !result.message.attachments.length) return new Response("A mensagem não pode ficar vazia.", { status: 400 });
  if (text.length > 5000) return new Response("A mensagem pode ter até 5.000 caracteres.", { status: 400 });
  await db.update(directMessages).set({ body: text, editedAt: new Date() }).where(eq(directMessages.id, result.message.id));
  return new Response(null, { status: 204 });
}

/** Apagar para todos: some o conteúdo e os anexos próprios; fica o aviso "Mensagem apagada". */
export async function DELETE(_request: Request, context: Context) {
  const result = await ownMessage(context);
  if ("error" in result) return result.error;
  await db.update(directMessages).set({ body: "", attachments: [], deletedAt: new Date() }).where(eq(directMessages.id, result.message.id));
  // Remove só os arquivos que são desta pessoa e não foram encaminhados de outra.
  await Promise.allSettled(result.message.attachments.filter(item => (item.ownerId ?? result.message.senderId) === result.message.senderId && !result.message.forwarded)
    .map(item => deleteFile(result.message.senderId, item.fileId)));
  return new Response(null, { status: 204 });
}
