import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { fileLimit } from "@/lib/storage/file-refs";
import { putFile } from "@/lib/storage/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > fileLimit) {
    return new Response("Selecione um arquivo de até 20 MB.", { status: 400 });
  }
  const fileId = randomUUID();
  await putFile(session.user.id, fileId, file);
  return Response.json({ fileId }, { status: 201 });
}
