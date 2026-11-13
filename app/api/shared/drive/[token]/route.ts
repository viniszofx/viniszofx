import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { driveFiles } from "@/lib/db/schema/app";
import { fileIdPattern } from "@/lib/storage/file-refs";
import { getFile } from "@/lib/storage/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ token: string }> };
type SharedItem = { id: string; kind: "folder" | "file"; name: string; parentId: string; color?: string; file?: { size?: number; type?: string; blob?: { __viniszofxFile?: string } } };

// Public, read-only access to a Drive file or folder through its random link token.
export async function GET(request: Request, context: Context) {
  const { token } = await context.params;
  if (!/^[0-9a-f]{36}$/.test(token)) return new Response(null, { status: 404 });
  const [sharedRow] = await db.select({ userId: driveFiles.userId, id: driveFiles.id, data: driveFiles.data }).from(driveFiles)
    .where(sql`${driveFiles.data}->>'shareToken' = ${token}`).limit(1);
  const raw = sharedRow?.data as SharedItem | undefined;
  if (!sharedRow || !raw) return new Response(null, { status: 404 });
  const data = { ...raw, id: sharedRow.id };
  const allRows = data.kind === "folder" ? await db.select({ id: driveFiles.id, data: driveFiles.data }).from(driveFiles).where(eq(driveFiles.userId, sharedRow.userId)) : [];
  const all = allRows.map((entry) => ({ ...(entry.data as SharedItem), id: entry.id }));
  const visibleIds = new Set<string>([sharedRow.id]);
  if (data.kind === "folder") {
    const descendants = [sharedRow.id];
    while (descendants.length) {
      const parent = descendants.pop()!;
      for (const child of all.filter((entry) => entry.parentId === parent)) if (!visibleIds.has(child.id)) { visibleIds.add(child.id); if (child.kind === "folder") descendants.push(child.id); }
    }
  }
  const requestedId = new URL(request.url).searchParams.get("item") ?? sharedRow.id;
  if (!visibleIds.has(requestedId)) return new Response(null, { status: 404 });
  const requested = requestedId === sharedRow.id ? data : all.find((entry) => entry.id === requestedId)!;
  if (new URL(request.url).searchParams.has("info")) {
    return Response.json({ kind: requested.kind, id: requested.id, name: requested.name, size: requested.file?.size ?? 0, items: requested.kind === "folder" ? all.filter((entry) => entry.parentId === requested.id).map(({ file: _file, ...entry }) => ({ id: entry.id, kind: entry.kind, name: entry.name, color: entry.color, size: _file?.size ?? 0 })) : undefined }, { headers: { "Cache-Control": "no-store" } });
  }
  if (requested.kind !== "file") return new Response("Pasta não possui conteúdo binário.", { status: 400 });
  const fileId = requested.file?.blob?.__viniszofxFile;
  if (!fileId || !fileIdPattern.test(fileId)) return new Response(null, { status: 404 });
  try {
    const object = await getFile(sharedRow.userId, fileId);
    const body = await object.Body?.transformToByteArray();
    if (!body) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(body), { headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(requested.name)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    } });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") return new Response(null, { status: 404 });
    throw error;
  }
}
