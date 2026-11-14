import { randomUUID } from "node:crypto";
import { canWrite, currentOrganization, readOnly, unauthorized } from "@/lib/organizations/current";
import { putFile } from "@/lib/storage/server";

export const runtime = "nodejs";
const types = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Envia a capa de um aviso (até 8 MB) para o storage de quem escreve; o aviso guarda o id. */
export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  if (!canWrite(context)) return readOnly();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !types.includes(file.type) || !file.size || file.size > 8 * 1024 * 1024) return new Response("Envie uma imagem PNG, JPG, WebP ou GIF de até 8 MB.", { status: 400 });
  const fileId = randomUUID();
  await putFile(context.userId, fileId, file);
  return Response.json({ fileId }, { status: 201 });
}
