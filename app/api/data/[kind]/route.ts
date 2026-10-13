import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { featureTables, migrationState } from "@/lib/db/schema/app";
import { collectionKinds, fileIds, type CollectionKind } from "@/lib/storage/file-refs";
import { deleteFile } from "@/lib/storage/server";

type Context = { params: Promise<{ kind: string }> };

async function scopeFor(context: Context) {
  const [{ data: session }, { kind }] = await Promise.all([auth.getSession(), context.params]);
  if (!session?.user || !collectionKinds.some((item) => item === kind)) return null;
  return { userId: session.user.id, kind: kind as CollectionKind };
}

async function rowsFor(scope: { userId: string; kind: CollectionKind }) {
  const table = featureTables[scope.kind];
  return db.select({ data: table.data }).from(table)
    .where(eq(table.userId, scope.userId)).orderBy(asc(table.position));
}

async function parseRecords(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 10 * 1024 * 1024) return null;
  try {
    const body = await request.json();
    if (!Array.isArray(body.data)) return null;
    const ids = new Set<string>();
    for (const item of body.data) {
      if (!item || typeof item !== "object" || Array.isArray(item) ||
          typeof item.id !== "string" || !item.id || ids.has(item.id)) return null;
      ids.add(item.id);
    }
    return body.data as Record<string, unknown>[];
  } catch { return null; }
}

export async function GET(_request: Request, context: Context) {
  const scope = await scopeFor(context);
  if (!scope) return new Response(null, { status: 401 });
  const [rows, state] = await Promise.all([
    rowsFor(scope),
    db.select({ kind: migrationState.kind }).from(migrationState)
      .where(and(eq(migrationState.userId, scope.userId), eq(migrationState.kind, scope.kind))).limit(1),
  ]);
  return Response.json({ exists: state.length > 0 || rows.length > 0, data: rows.map((row) => row.data) },
    { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request, context: Context) {
  const scope = await scopeFor(context);
  if (!scope) return new Response(null, { status: 401 });
  const data = await parseRecords(request);
  if (!data) return new Response("Dados inválidos ou muito grandes.", { status: 400 });
  const table = featureTables[scope.kind];
  const state = await db.select({ kind: migrationState.kind }).from(migrationState)
    .where(and(eq(migrationState.userId, scope.userId), eq(migrationState.kind, scope.kind))).limit(1);
  if (state.length) return new Response(null, { status: 204 });
  const marker = db.insert(migrationState).values({ userId: scope.userId, kind: scope.kind }).onConflictDoNothing();
  if (data.length) {
    await db.batch([
      db.insert(table).values(data.map((item, position) => ({ userId: scope.userId, id: item.id as string, position, data: item }))).onConflictDoNothing(),
      marker,
    ]);
  } else await marker;
  return new Response(null, { status: 204 });
}

export async function PUT(request: Request, context: Context) {
  const scope = await scopeFor(context);
  if (!scope) return new Response(null, { status: 401 });
  const data = await parseRecords(request);
  if (!data) return new Response("Dados inválidos ou muito grandes.", { status: 400 });
  const table = featureTables[scope.kind];
  const previous = await rowsFor(scope);
  const remove = db.delete(table).where(eq(table.userId, scope.userId));
  const marker = db.insert(migrationState).values({ userId: scope.userId, kind: scope.kind }).onConflictDoNothing();
  if (data.length) {
    await db.batch([
      remove,
      db.insert(table).values(data.map((item, position) => ({ userId: scope.userId, id: item.id as string, position, data: item }))),
      marker,
    ]);
  } else await db.batch([remove, marker]);

  // Delete orphaned S3 objects only after the database batch has committed.
  const retained = new Set<string>();
  const all = await Promise.all(collectionKinds.map((kind) => rowsFor({ userId: scope.userId, kind })));
  for (const rows of all) for (const row of rows) fileIds(row.data, retained);
  const removed = [...fileIds(previous.map((row) => row.data))].filter((id) => !retained.has(id));
  await Promise.allSettled(removed.map((id) => deleteFile(scope.userId, id)));
  return new Response(null, { status: 204 });
}
