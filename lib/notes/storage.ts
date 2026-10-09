import { attachmentLimit, createId, type Note, type NoteAttachment, type StoredAttachment } from "./types";

let database: Promise<IDBDatabase> | undefined;
const journalPrefix = "viniszofx:note-draft:";
const attachmentCache = new Map<string, Promise<StoredAttachment | undefined>>();

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
function complete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    const failed = () => reject(new Error(transaction.error?.name === "QuotaExceededError"
      ? "O armazenamento do navegador está cheio. Exporte suas notas e remova arquivos para liberar espaço."
      : "Não foi possível salvar no navegador. Tente novamente."));
    transaction.onerror = failed;
    transaction.onabort = failed;
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
export function hasPendingDraft(id: string) {
  try { return localStorage.getItem(`${journalPrefix}${id}`) !== null; } catch { return false; }
}
export function writeDraft(note: Note) {
  // A small synchronous journal recovers the last keystrokes after an abrupt reload.
  try { localStorage.setItem(`${journalPrefix}${note.id}`, JSON.stringify(note)); } catch { /* IndexedDB remains the primary store. */ }
}
export async function listNotes(): Promise<Note[]> {
  const db = await openDatabase();
  const notes = await result<Note[]>(db.transaction("notes").objectStore("notes").getAll());
  const merged = new Map(notes.map((note) => [note.id, note]));
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith(journalPrefix)) continue;
    try {
      const draft: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
      if (validNote(draft) && (!merged.has(draft.id) || draft.updatedAt > merged.get(draft.id)!.updatedAt)) merged.set(draft.id, draft);
    } catch { /* Ignore a damaged recovery journal without losing valid notes. */ }
  }
  return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function saveNote(note: Note) {
  const db = await openDatabase();
  const tx = db.transaction("notes", "readwrite");
  const done = complete(tx);
  tx.objectStore("notes").put(note);
  await done;
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
  const db = await openDatabase();
  const tx = db.transaction(["notes", "attachments"], "readwrite");
  const done = complete(tx);
  tx.objectStore("notes").delete(id);
  const cursor = tx.objectStore("attachments").index("noteId").openCursor(IDBKeyRange.only(id));
  cursor.onsuccess = () => {
    if (!cursor.result) return;
    attachmentCache.delete(String(cursor.result.primaryKey));
    cursor.result.delete(); cursor.result.continue();
  };
  await done;
  localStorage.removeItem(`${journalPrefix}${id}`);
  notify();
}
export async function listAttachments(noteId: string): Promise<NoteAttachment[]> {
  const db = await openDatabase();
  const files = await result<StoredAttachment[]>(db.transaction("attachments").objectStore("attachments").index("noteId").getAll(noteId));
  return files.map((file) => ({ id: file.id, noteId: file.noteId, name: file.name, size: file.size,
    contentType: file.contentType, createdAt: file.createdAt }));
}
export async function saveAttachment(noteId: string, file: File): Promise<NoteAttachment> {
  if (!file.size || file.size > attachmentLimit) throw new Error("Selecione arquivos de até 20 MB cada.");
  const db = await openDatabase();
  const stored: StoredAttachment = { id: createId(), noteId, name: file.name, size: file.size,
    contentType: file.type || "application/octet-stream", createdAt: new Date().toISOString(), blob: file };
  const tx = db.transaction("attachments", "readwrite");
  const done = complete(tx);
  tx.objectStore("attachments").add(stored);
  await done;
  attachmentCache.set(stored.id, Promise.resolve(stored));
  return { id: stored.id, noteId, name: stored.name, size: stored.size, contentType: stored.contentType, createdAt: stored.createdAt };
}
export function getAttachment(id: string) {
  let pending = attachmentCache.get(id);
  if (!pending) {
    pending = openDatabase().then((db) => result<StoredAttachment | undefined>(db.transaction("attachments").objectStore("attachments").get(id)));
    attachmentCache.set(id, pending);
    void pending.catch(() => attachmentCache.delete(id));
  }
  return pending;
}
export async function deleteAttachment(id: string) {
  const db = await openDatabase();
  const tx = db.transaction("attachments", "readwrite");
  const done = complete(tx);
  tx.objectStore("attachments").delete(id);
  await done;
  attachmentCache.delete(id);
}
