import { randomUUID } from "node:crypto";
import { currentOrganization, readOnly, unauthorized } from "@/lib/organizations/current";
import { fileLimit } from "@/lib/storage/file-refs";
import { putFile } from "@/lib/storage/server";

export const runtime = "nodejs";

/** Envia um anexo de mensagem (até 20 MB) para o storage de quem envia. */
export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  if (context.role === "external" && !context.admin) return readOnly();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.size || file.size > fileLimit) return new Response("Escolha um arquivo de até 20 MB.", { status: 400 });
  const fileId = randomUUID();
  await putFile(context.userId, fileId, file);
  return Response.json({ fileId, name: file.name || "arquivo", type: file.type || "application/octet-stream", size: file.size }, { status: 201 });
}
