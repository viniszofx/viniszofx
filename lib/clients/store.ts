"use client";

import { useSyncExternalStore } from "react";

export type ClientFields = { name: string; company: string; email: string; phone: string; address: string; notes: string };
export type Client = ClientFields & { id: string; createdAt: string; updatedAt: string };
type Snapshot = { clients: Client[]; loaded: boolean; pending: number; error: string };
const initial: Snapshot = { clients: [], loaded: false, pending: 0, error: "" };
let snapshot = initial;
let database: Promise<IDBDatabase> | undefined;
let queue = Promise.resolve();
let revision = 0;
let unsaved = false;
const listeners = new Set<() => void>();
let dispose: (() => void) | undefined;
const emit = () => listeners.forEach(listener => listener());
function db() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("viniszofx-clients", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("clients", { keyPath: "id" });
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
    request.onerror = () => { database = undefined; reject(request.error); };
  });
  return database;
}
async function load() {
  const version = revision;
  try {
    const database = await db();
    const clients = await new Promise<Client[]>((resolve, reject) => {
      const request = database.transaction("clients").objectStore("clients").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (version === revision && !snapshot.pending && !unsaved) snapshot = { ...snapshot, clients, loaded: true, error: "" };
  } catch { snapshot = { ...snapshot, loaded: true, error: "Não foi possível carregar os clientes neste navegador." }; }
  emit();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (!snapshot.loaded) void load();
    const refresh = () => { if (!snapshot.pending && !unsaved) void load(); };
    window.addEventListener("focus", refresh);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("viniszofx-clients") : undefined;
    if (channel) channel.onmessage = refresh;
    dispose = () => { window.removeEventListener("focus", refresh); channel?.close(); };
  }
  return () => { listeners.delete(listener); if (!listeners.size) { dispose?.(); dispose = undefined; } };
}
function persist(clients: Client[]) {
  revision++; unsaved = true;
  snapshot = { ...snapshot, clients, pending: snapshot.pending + 1, error: "" }; emit();
  queue = queue.then(async () => {
    const database = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("clients", "readwrite");
      const store = tx.objectStore("clients"); store.clear(); clients.forEach(client => store.put(client));
      tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
    });
    if (snapshot.clients === clients) { unsaved = false; snapshot = { ...snapshot, error: "" }; }
    if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("viniszofx-clients"); channel.postMessage("changed"); channel.close(); }
  }).catch(() => { snapshot = { ...snapshot, error: "Não foi possível salvar os clientes. Tente novamente." }; })
    .finally(() => { snapshot = { ...snapshot, pending: snapshot.pending - 1 }; emit(); });
}
export function useClients() { return useSyncExternalStore(subscribe, () => snapshot, () => initial); }
export function saveClient(fields: ClientFields, id?: string) {
  if (!snapshot.loaded) return;
  const previous = snapshot.clients.find(client => client.id === id);
  const now = new Date().toISOString();
  const client: Client = { ...fields, id: previous?.id ?? (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("")), createdAt: previous?.createdAt ?? now, updatedAt: now };
  persist(previous ? snapshot.clients.map(item => item.id === previous.id ? client : item) : [...snapshot.clients, client]);
}
export function deleteClient(id: string) { persist(snapshot.clients.filter(client => client.id !== id)); }
export function retryClients() { if (unsaved) persist(snapshot.clients); else void load(); }
export function matchesClient(client: Client, query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const text = normalize([client.name, client.company, client.email, client.phone, client.address, client.notes].join(" "));
  return normalize(query.trim()).split(/\s+/).filter(Boolean).every(term => text.includes(term));
}
