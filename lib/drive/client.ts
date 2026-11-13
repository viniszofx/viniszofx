"use client";

import { fetchStoredFile, uploadStoredFile } from "@/lib/storage/collections";
import { fieldsOf, newId } from "@/lib/records/store";
import { driveStore, type DriveFields, type DriveItem } from "@/lib/nodus/stores";
import { createZip, type ZipEntry } from "./zip";
import { createDocx, createPdf, createXlsx, DOCX_TYPE, extension, MEDIA, PDF_TYPE, safeName, uniqueName, XLSX_TYPE, type FolderColor } from "./files";

/** Downloads the file content, re-applying a type the browser can preview. */
export async function readDriveFile(item: DriveItem) {
  if (!item.file) throw new Error("Este item não tem arquivo.");
  const blob = await fetchStoredFile(item.file.blob);
  return new Blob([blob], { type: MEDIA[extension(item.name)] ?? item.file.type ?? "application/octet-stream" });
}

/** Uploads first, then records the item, so a saved record always has its object. */
export async function uploadToDrive(file: File, parentId: string) {
  const blob = await uploadStoredFile(file);
  return driveStore.save({ kind: "file", name: file.name, parentId, file: { id: newId(), name: file.name, type: file.type, size: file.size, blob } });
}

export function descendants(items: DriveItem[], id: string): DriveItem[] {
  return items.filter(item => item.parentId === id).flatMap(item => [item, ...descendants(items, item.id)]);
}

export function folderSize(items: DriveItem[], item: DriveItem): number {
  return item.kind === "file" ? item.file?.size ?? 0 : descendants(items, item.id).reduce((sum, entry) => sum + (entry.file?.size ?? 0), 0);
}

export async function zipDriveItems(all: DriveItem[], targets: DriveItem[]) {
  const entries: ZipEntry[] = [];
  async function add(items: DriveItem[], prefix: string) {
    const names = new Set<string>();
    for (const item of items) {
      const name = uniqueName(safeName(item.name), names);
      if (item.kind === "folder") {
        const children = all.filter(entry => entry.parentId === item.id);
        if (!children.length) entries.push({ path: `${prefix}${name}/`, data: new Uint8Array() });
        await add(children, `${prefix}${name}/`);
      } else entries.push({ path: `${prefix}${name}`, data: await readDriveFile(item) });
    }
  }
  await add(targets, "");
  return createZip(entries);
}

export function touchDriveItem(item: DriveItem) {
  driveStore.save({ ...fieldsOf<DriveFields>(item), openedAt: new Date().toISOString() }, item.id, { silent: true, keepUpdatedAt: true });
}

export function setShareLink(item: DriveItem, enabled: boolean) {
  const token = enabled ? Array.from(crypto.getRandomValues(new Uint8Array(18)), byte => byte.toString(16).padStart(2, "0")).join("") : undefined;
  const fields = { ...fieldsOf<DriveFields>(item) };
  if (token) fields.shareToken = token; else delete fields.shareToken;
  driveStore.save(fields, item.id);
  return token;
}

export const shareUrl = (token: string) => `${window.location.origin}/arquivo/${token}`;

/** Ids of the items plus everything inside the folders among them. */
export function withDescendants(all: DriveItem[], items: DriveItem[]) {
  return new Set(items.flatMap(item => [item.id, ...descendants(all, item.id).map(entry => entry.id)]));
}

/** Moves items into `destination` ("" = root). Returns false when a folder would go inside itself. */
export function moveDriveItems(ids: string[], destination: string) {
  const all = driveStore.current();
  const targets = all.filter(item => ids.includes(item.id));
  if (destination && withDescendants(all, targets).has(destination)) return false;
  const moved = new Set(targets.filter(item => item.parentId !== destination).map(item => item.id));
  if (moved.size) driveStore.replaceAll(all.map(item => moved.has(item.id) ? { ...item, parentId: destination, updatedAt: new Date().toISOString() } : item), moved.size === 1 ? "Item movido" : `${moved.size} itens movidos`);
  return true;
}

export function removeDriveItems(items: DriveItem[]) {
  const all = driveStore.current();
  const ids = withDescendants(all, items);
  const notice = items.length > 1 ? `${items.length} itens excluídos` : items[0]?.kind === "folder" ? "Pasta excluída" : "Arquivo excluído";
  driveStore.replaceAll(all.filter(item => !ids.has(item.id)), notice);
}

export function renameDriveItem(item: DriveItem, name: string) {
  driveStore.save({ ...fieldsOf<DriveFields>(item), name }, item.id);
}

export function paintFolder(item: DriveItem, color: FolderColor) {
  driveStore.save({ ...fieldsOf<DriveFields>(item), color }, item.id, { silent: true });
}

export function createFolder(name: string, parentId: string) {
  driveStore.save({ kind: "folder", name, parentId });
}

/** Creates a blank Office file named `name` and uploads it. */
export async function createOfficeFile(kind: "docx" | "xlsx" | "pdf", name: string, parentId: string) {
  const blob = kind === "docx" ? await createDocx() : kind === "xlsx" ? await createXlsx() : await createPdf();
  const base = name.replace(/\.(docx|xlsx|pdf)$/i, "");
  const type = kind === "docx" ? DOCX_TYPE : kind === "xlsx" ? XLSX_TYPE : PDF_TYPE;
  return uploadToDrive(new File([blob], `${base}.${kind}`, { type }), parentId);
}

/** Grava um item; falha com mensagem clara se o Drive ainda não carregou. */
function saveItem(fields: DriveFields) {
  const item = driveStore.save(fields);
  if (!item) throw new Error("O Drive ainda está carregando. Tente de novo em instantes.");
  return item;
}
function requireItem(item: DriveItem | undefined) {
  if (!item) throw new Error("O Drive ainda está carregando. Tente de novo em instantes.");
  return item;
}

/** Duplica arquivos e árvores de pastas mantendo a estrutura e gerando novos objetos. */
export async function duplicateDriveItems(all: DriveItem[], targets: DriveItem[]) {
  const created: DriveItem[] = [];
  const copy = async (source: DriveItem, parentId: string, root: boolean) => {
    const name = root && source.kind === "file"
      ? (() => { const dot = source.name.lastIndexOf("."); return dot > 0 ? `${source.name.slice(0, dot)} (cópia)${source.name.slice(dot)}` : `${source.name} (cópia)`; })()
      : root ? `${source.name} (cópia)` : source.name;
    if (source.kind === "folder") {
      const folder = saveItem({ kind: "folder", name, parentId, color: source.color });
      created.push(folder);
      for (const child of all.filter((entry) => entry.parentId === source.id)) await copy(child, folder.id, false);
    } else {
      const blob = await readDriveFile(source);
      created.push(requireItem(await uploadToDrive(new File([blob], name, { type: source.file?.type || blob.type }), parentId)));
    }
  };
  for (const target of targets) await copy(target, target.parentId, true);
  return created;
}

/** Imports a folder selection (webkitRelativePath) and recreates its nested directories. */
export async function uploadDriveFolder(files: File[], rootParentId: string) {
  const folders = new Map<string, string>([["", rootParentId]]);
  const created: DriveItem[] = [];
  for (const file of files) {
    const parts = (file as File & { webkitRelativePath?: string }).webkitRelativePath?.split("/").filter(Boolean) ?? [file.name];
    let parentId = rootParentId;
    for (const [index, folderName] of parts.slice(0, -1).entries()) {
      const path = parts.slice(0, index + 1).join("/");
      let id = folders.get(path);
      if (!id) {
        const folder = saveItem({ kind: "folder", name: folderName, parentId });
        created.push(folder);
        id = folder.id;
        folders.set(path, id);
      }
      parentId = id;
    }
    created.push(requireItem(await uploadToDrive(file, parentId)));
  }
  return created;
}

/** Saves edited content: uploads it, then points the item at the new object. Returns the new object id. */
export async function replaceDriveFile(itemId: string, blob: Blob) {
  const reference = await uploadStoredFile(blob);
  const current = driveStore.current().find(item => item.id === itemId);
  if (!current?.file) throw new Error("O arquivo não existe mais no Drive.");
  driveStore.save({ ...fieldsOf<DriveFields>(current), file: { ...current.file, blob: reference, size: blob.size, type: blob.type || current.file.type } }, itemId, { silent: true });
  return reference.__viniszofxFile;
}
