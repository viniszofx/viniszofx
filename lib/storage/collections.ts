"use client";

import { fileIdPattern, type CollectionKind } from "./file-refs";

type FileReference = { __viniszofxFile: string; type: string };
const uploaded = new WeakMap<Blob, string>();
const downloaded = new Map<string, Promise<Blob>>();

async function responseOrError(response: Response) {
  if (response.ok) return response;
  if (response.status === 401) throw new Error("Sua sessão expirou. Entre novamente.");
  throw new Error((await response.text()) || "Não foi possível acessar seus dados no servidor.");
}

async function upload(blob: Blob) {
  const previous = uploaded.get(blob);
  if (previous) return previous;
  const form = new FormData();
  form.set("file", blob, blob instanceof File ? blob.name : "attachment");
  const response = await responseOrError(await fetch("/api/data/files", { method: "POST", body: form }));
  const value: { fileId: string } = await response.json();
  uploaded.set(blob, value.fileId);
  return value.fileId;
}

async function serialize(value: unknown): Promise<unknown> {
  if (value instanceof Blob) return { __viniszofxFile: await upload(value), type: value.type } satisfies FileReference;
  if (Array.isArray(value)) return Promise.all(value.map(serialize));
  if (value && typeof value === "object") {
    const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await serialize(item)] as const));
    return Object.fromEntries(entries);
  }
  return value;
}

async function download(reference: FileReference) {
  let pending = downloaded.get(reference.__viniszofxFile);
  if (!pending) {
    pending = responseOrError(await fetch(`/api/data/files/${reference.__viniszofxFile}`))
      .then((response) => response.blob())
      .then((blob) => { uploaded.set(blob, reference.__viniszofxFile); return blob; });
    downloaded.set(reference.__viniszofxFile, pending);
    void pending.catch(() => downloaded.delete(reference.__viniszofxFile));
  }
  return pending;
}

async function hydrate(value: unknown): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map(hydrate));
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.__viniszofxFile === "string" && fileIdPattern.test(record.__viniszofxFile)) {
      return download(record as FileReference);
    }
    const entries = await Promise.all(Object.entries(record).map(async ([key, item]) => [key, await hydrate(item)] as const));
    return Object.fromEntries(entries);
  }
  return value;
}

export async function readCollection<T>(kind: CollectionKind, legacy?: () => Promise<T[]>): Promise<T[]> {
  const endpoint = `/api/data/${kind}`;
  const response = await responseOrError(await fetch(endpoint, { cache: "no-store" }));
  const result: { exists: boolean; data: unknown[] } = await response.json();
  if (!result.exists) {
    const items = legacy ? await legacy() : [];
    const data = await serialize(items);
    await responseOrError(await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }),
    }));
    const stored = await responseOrError(await fetch(endpoint, { cache: "no-store" }));
    return await hydrate((await stored.json()).data) as T[];
  }
  return await hydrate(result.data) as T[];
}

export async function writeCollection<T>(kind: CollectionKind, items: T[]) {
  const data = await serialize(items);
  await responseOrError(await fetch(`/api/data/${kind}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }),
  }));
}
