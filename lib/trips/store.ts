"use client";

import { useSyncExternalStore } from "react";
import { notifySuccess, notifyError } from "@/lib/ui/notifications";

export const transportModes = [{ value: "car", label: "Car" }, { value: "motorcycle", label: "Motorcycle" }, { value: "bus", label: "Bus" }, { value: "plane", label: "Plane" }, { value: "ship", label: "Ship" }] as const;
export type TransportMode = (typeof transportModes)[number]["value"] | "truck" | "van" | "other";
export function vehicleTransport(type: string): TransportMode { const value = type.toLowerCase(); return ["car", "motorcycle", "bus", "plane", "ship", "truck", "van"].includes(value) ? value as TransportMode : "other"; }
export type TripLodging = { name: string; phone: string; address: string; dailyRate: string };
export type TripFields = { city?: string; state?: string; street?: string; number?: string; complement?: string; neighborhood?: string; postalCode?: string; departureDate?: string; returnDate?: string; initialKm?: string; finalKm?: string; information?: string; location?: string; needsLodging?: boolean; reservationId?: string; lodging?: TripLodging; boardId?: string; vehicleId?: string; description: string; clientId: string; transport: TransportMode };
export type Trip = TripFields & { id: string; code: string; createdAt: string; updatedAt: string };
type Snapshot = { trips: Trip[]; loaded: boolean; pending: number; error: string };
const initial: Snapshot = { trips: [], loaded: false, pending: 0, error: "" };
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
    const request = indexedDB.open("viniszofx-trips", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("trips", { keyPath: "id" });
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
    request.onerror = () => { database = undefined; reject(request.error); };
  });
  return database;
}
async function load() {
  const version = revision;
  try {
    const database = await db();
    const trips = await new Promise<Trip[]>((resolve, reject) => {
      const request = database.transaction("trips").objectStore("trips").getAll();
      request.onsuccess = () => resolve(request.result.map((trip: Trip & { name?: string }) => ({ ...trip, code: trip.code ?? trip.id.replace(/-/g, "").slice(0, 8).toUpperCase(), description: trip.description ?? trip.name ?? "" })));
      request.onerror = () => reject(request.error);
    });
    if (version === revision && !snapshot.pending && !unsaved) snapshot = { ...snapshot, trips, loaded: true, error: "" };
  } catch { snapshot = { ...snapshot, loaded: true, error: "Não foi possível carregar as viagens neste navegador." }; }
  emit();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (!snapshot.loaded) void load();
    const refresh = () => { if (!snapshot.pending && !unsaved) void load(); };
    window.addEventListener("focus", refresh);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("viniszofx-trips") : undefined;
    if (channel) channel.onmessage = refresh;
    dispose = () => { window.removeEventListener("focus", refresh); channel?.close(); };
  }
  return () => { listeners.delete(listener); if (!listeners.size) { dispose?.(); dispose = undefined; } };
}
function persist(trips: Trip[], notice?: string) {
  revision++; unsaved = true;
  snapshot = { ...snapshot, trips, pending: snapshot.pending + 1, error: "" }; emit();
  queue = queue.then(async () => {
    const database = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("trips", "readwrite");
      const store = tx.objectStore("trips"); store.clear(); trips.forEach(trip => store.put(trip));
      tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
    });
    if (snapshot.trips === trips) { unsaved = false; snapshot = { ...snapshot, error: "" }; }
    if (notice) notifySuccess(notice);
    if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("viniszofx-trips"); channel.postMessage("changed"); channel.close(); }
  }).catch(() => { snapshot = { ...snapshot, error: "Não foi possível salvar as viagens. Tente novamente." }; notifyError("Falha ao salvar", "Não foi possível salvar as viagens. Tente novamente."); })
    .finally(() => { snapshot = { ...snapshot, pending: snapshot.pending - 1 }; emit(); });
}
export function useTrips() { return useSyncExternalStore(subscribe, () => snapshot, () => initial); }
export function saveTrip(fields: TripFields, id?: string, options?: { silent?: boolean }) {
  if (!snapshot.loaded) return;
  const previous = snapshot.trips.find(trip => trip.id === id);
  const now = new Date().toISOString();
  const generateId = () => typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
  let tripId = previous?.id ?? generateId();
  let code = previous?.code ?? tripId.replace(/-/g, "").slice(0, 8).toUpperCase();
  if (!previous) { while (snapshot.trips.some(trip => trip.code === code)) { tripId = generateId(); code = tripId.replace(/-/g, "").slice(0, 8).toUpperCase(); } }
  const trip: Trip = { ...fields, id: tripId, code, createdAt: previous?.createdAt ?? now, updatedAt: now };
  persist(previous ? snapshot.trips.map(item => item.id === previous.id ? trip : item) : [...snapshot.trips, trip], options?.silent ? undefined : previous ? "Viagem atualizada" : "Viagem cadastrada");
}
export function deleteTrip(id: string) { persist(snapshot.trips.filter(trip => trip.id !== id), "Viagem excluída"); }
export function retryTrips() { if (unsaved) persist(snapshot.trips); else void load(); }
export function matchesTrip(trip: Trip, query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const text = normalize([trip.code, trip.description, trip.transport, trip.city, trip.state, trip.street, trip.number, trip.complement, trip.neighborhood, trip.postalCode, trip.departureDate, trip.returnDate, trip.location, trip.needsLodging ? [trip.lodging?.name, trip.lodging?.address].join(" ") : ""].join(" "));
  return normalize(query.trim()).split(/\s+/).filter(Boolean).every(term => text.includes(term));
}
