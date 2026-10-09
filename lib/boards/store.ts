"use client";

import { useSyncExternalStore } from "react";

export type CardAttachment = { id: string; name: string; type: string; size: number; blob: Blob };
export type CoverPosition = { x: number; y: number };
export type BoardCard = { createdAt?: string; updatedAt?: string; id: string; title: string; description: string; descriptionDocument?: Record<string, unknown> | null; completed: boolean; color: string; coverAttachmentId?: string | null; coverPosition?: CoverPosition; attachments?: CardAttachment[] };
export type BoardList = { id: string; title: string; color: string; cards: BoardCard[] };
export type Board = { coverPosition?: CoverPosition; cover?: CardAttachment; id: string; title: string; color: string; lists: BoardList[]; createdAt: string; updatedAt: string };
type Snapshot = { boards: Board[]; loaded: boolean; error: string; pending: number };
const initial: Snapshot = { boards: [], loaded: false, error: "", pending: 0 };
let snapshot = initial;
const listeners = new Set<() => void>();
let database: Promise<IDBDatabase> | undefined;
let queue = Promise.resolve();
let unsaved = false;
function emit() { listeners.forEach(listener => listener()); }
function db() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("viniszofx-boards", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("boards", { keyPath: "id" });
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
    request.onerror = () => { database = undefined; reject(request.error); };
  });
  return database;
}
async function load() {
  try {
    const database = await db();
    const boards = await new Promise<Board[]>((resolve, reject) => {
      const request = database.transaction("boards").objectStore("boards").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!snapshot.pending) snapshot = { ...snapshot, boards, loaded: true, error: "" };
  } catch { snapshot = { ...snapshot, loaded: true, error: "Não foi possível carregar Boards neste navegador." }; }
  emit();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot.loaded) void load();
  const refresh = () => { if (!snapshot.pending && !snapshot.error) void load(); };
  window.addEventListener("focus", refresh);
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("viniszofx-boards") : undefined;
  if (channel) channel.onmessage = refresh;
  return () => { listeners.delete(listener); window.removeEventListener("focus", refresh); channel?.close(); };
}
function persist(boards: Board[]) {
  unsaved = true;
  snapshot = { ...snapshot, boards, pending: snapshot.pending + 1, error: "" }; emit();
  queue = queue.then(async () => {
    const database = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("boards", "readwrite");
      const store = tx.objectStore("boards"); store.clear(); boards.forEach(board => store.put(board));
      tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
    });
    if (snapshot.boards === boards) { unsaved = false; snapshot = { ...snapshot, error: "" }; }
    if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("viniszofx-boards"); channel.postMessage("changed"); channel.close(); }
  }).catch(() => { snapshot = { ...snapshot, error: "Não foi possível salvar. Mantenha esta página aberta e tente novamente." }; })
    .finally(() => { snapshot = { ...snapshot, pending: snapshot.pending - 1 }; emit(); });
}
export function useBoards() { return useSyncExternalStore(subscribe, () => snapshot, () => initial); }
export function saveBoard(board: Board) {
  const now = new Date().toISOString();
  const previous = snapshot.boards.find(item => item.id === board.id);
  const previousCards = new Map(previous?.lists.flatMap(list => list.cards.map(card => [card.id, { card, listId: list.id }] as const)) ?? []);
  const next = { ...board, updatedAt: now, lists: board.lists.map(list => ({ ...list, cards: list.cards.map(card => {
    const old = previousCards.get(card.id);
    if (old?.card === card && old.listId === list.id) return card;
    return { ...card, createdAt: old ? old.card.createdAt : card.createdAt ?? now, updatedAt: now };
  }) })) };
  persist(snapshot.boards.some(item => item.id === board.id) ? snapshot.boards.map(item => item.id === board.id ? next : item) : [...snapshot.boards, next]);
}
export function deleteBoard(id: string) { persist(snapshot.boards.filter(board => board.id !== id)); }
export function retryBoards() { if (unsaved) persist(snapshot.boards); else void load(); }
export function newId() { return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join(""); }
export function reorder<T>(items: T[], from: number, to: number) { const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; }

export function defaultLists(): BoardList[] { return ["Stage", "Progress", "Done"].map(title => ({ id: newId(), title, color: "", cards: [] })); }

export function descriptionText(card: BoardCard): string {
  function text(node: unknown): string {
    if (!node || typeof node !== "object") return "";
    const value = node as { text?: string; content?: unknown[] };
    return value.text ?? value.content?.map(text).filter(Boolean).join(" ") ?? "";
  }
  return card.descriptionDocument ? text(card.descriptionDocument) : card.description;
}
