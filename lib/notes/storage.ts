import { attachmentLimit, createId, type Note, type NoteAttachment, type StoredAttachment } from "./types";
import { readCollection, writeCollection } from "@/lib/storage/collections";

let database: Promise<IDBDatabase> | undefined;
const journalPrefix = "viniszofx:note-draft:";
const attachmentCache = new Map<string, Promise<StoredAttachment | undefined>>();
let noteQueue = Promise.resolve();
let attachmentQueue = Promise.resolve();

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("viniszofx-notes", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("notes", { keyPath: "id" });
      const files = request.result.createObjectStore("attachments", { keyPath: "id" });
      files.createIndex("noteId", "noteId");
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); database = undefined; };
      resolve(request.result);
    };
    request.onerror = () => { database = undefined; reject(new Error("Não foi possível abrir o armazenamento de anotações.")); };
  });
  return database;
}
function result<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function notify() {
  window.dispatchEvent(new Event("viniszofx:notes-changed"));
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("viniszofx-notes");
    channel.postMessage("changed"); channel.close();
  }
}
function validNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") return false;
  const note = value as Note;
  return typeof note.id === "string" && typeof note.title === "string" &&
    typeof note.content === "string" && typeof note.updatedAt === "string";
}
function readNotes() {
  return readCollection<Note>("notes", async () => {
    const db = await openDatabase();
    return result<Note[]>(db.transaction("notes").objectStore("notes").getAll());
  });
}
function readStoredAttachments() {
  return readCollection<StoredAttachment>("attachments", async () => {
    const db = await openDatabase();
    return result<StoredAttachment[]>(db.transaction("attachments").objectStore("attachments").getAll());
  });
}
export function hasPendingDraft(id: string) {
  try { return localStorage.getItem(`${journalPrefix}${id}`) !== null; } catch { return false; }
}
export function writeDraft(note: Note) {
  // A small synchronous journal recovers the last keystrokes after an abrupt reload.
  try { localStorage.setItem(`${journalPrefix}${note.id}`, JSON.stringify(note)); } catch { /* IndexedDB remains the primary store. */ }
}
export async function listNotes(): Promise<Note[]> {
  const notes = await readNotes();
  const merged = new Map(notes.map((note) => [note.id, note]));
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith(journalPrefix)) continue;
    try {
      const draft: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
      if (validNote(draft) && merged.has(draft.id) && draft.updatedAt > merged.get(draft.id)!.updatedAt) merged.set(draft.id, draft);
    } catch { /* Ignore a damaged recovery journal without losing valid notes. */ }
  }
  return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function saveNote(note: Note) {
  const operation = noteQueue.then(async () => {
    const notes = await readNotes();
    await writeCollection("notes", [...notes.filter((item) => item.id !== note.id), note]);
  });
  noteQueue = operation.catch(() => {});
  await operation;
  try {
    const draft = localStorage.getItem(`${journalPrefix}${note.id}`);
    if (draft === JSON.stringify(note)) localStorage.removeItem(`${journalPrefix}${note.id}`);
  } catch { /* The durable note was already saved. */ }
  notify();
  return note;
}
export async function createNote() {
  const now = new Date().toISOString();
  return saveNote({ id: createId(), title: "", content: "", document: null,
    coverAttachmentId: null, coverPosition: 50, createdAt: now, updatedAt: now });
}
export async function deleteNote(id: string) {
  const operation = noteQueue.then(async () => {
    const notes = await readNotes();
    await writeCollection("notes", notes.filter((note) => note.id !== id));
  });
  noteQueue = operation.catch(() => {});
  await operation;
  const files = await readStoredAttachments();
  await writeCollection("attachments", files.filter((file) => file.noteId !== id));
  files.filter((file) => file.noteId === id).forEach((file) => attachmentCache.delete(file.id));
  localStorage.removeItem(`${journalPrefix}${id}`);
  notify();
}
export async function listAttachments(noteId: string): Promise<NoteAttachment[]> {
  const files = await readStoredAttachments();
  return files.filter((file) => file.noteId === noteId).map((file) => ({ id: file.id, noteId: file.noteId, name: file.name, size: file.size,
    contentType: file.contentType, createdAt: file.createdAt }));
}
export async function saveAttachment(noteId: string, file: File): Promise<NoteAttachment> {
  if (!file.size || file.size > attachmentLimit) throw new Error("Selecione arquivos de até 20 MB cada.");
  const stored: StoredAttachment = { id: createId(), noteId, name: file.name, size: file.size,
    contentType: file.type || "application/octet-stream", createdAt: new Date().toISOString(), blob: file };
  const operation = attachmentQueue.then(async () => {
    const files = await readStoredAttachments();
    await writeCollection("attachments", [...files, stored]);
  });
  attachmentQueue = operation.catch(() => {});
  await operation;
  attachmentCache.set(stored.id, Promise.resolve(stored));
  return { id: stored.id, noteId, name: stored.name, size: stored.size, contentType: stored.contentType, createdAt: stored.createdAt };
}
export function getAttachment(id: string) {
  let pending = attachmentCache.get(id);
  if (!pending) {
    pending = readStoredAttachments().then((files) => files.find((file) => file.id === id));
    attachmentCache.set(id, pending);
    void pending.catch(() => attachmentCache.delete(id));
  }
  return pending;
}
export async function deleteAttachment(id: string) {
  const operation = attachmentQueue.then(async () => {
    const files = await readStoredAttachments();
    await writeCollection("attachments", files.filter((file) => file.id !== id));
  });
  attachmentQueue = operation.catch(() => {});
  await operation;
  attachmentCache.delete(id);
}
