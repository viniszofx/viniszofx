"use client";

import type { CardAttachment } from "@/lib/boards/store";
import { addressText, type AddressFieldsValue } from "@/lib/format/address";
import { useSyncExternalStore } from "react";
import { notifySuccess, notifyError } from "@/lib/ui/notifications";

export type ReservationFields = AddressFieldsValue & { attachments?: CardAttachment[]; name: string; phone: string; address?: string; dailyRate: string; departureDate: string; returnDate: string; notes: string };
export type Reservation = ReservationFields & { id: string; code: string; createdAt: string; updatedAt: string };
type Snapshot = { reservations: Reservation[]; loaded: boolean; pending: number; error: string };
const initial: Snapshot = { reservations: [], loaded: false, pending: 0, error: "" };
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
    const request = indexedDB.open("viniszofx-reservations", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("reservations", { keyPath: "id" });
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
    request.onerror = () => { database = undefined; reject(request.error); };
  });
  return database;
}
async function load() {
  const version = revision;
  try {
    const database = await db();
    const reservations = await new Promise<Reservation[]>((resolve, reject) => {
      const request = database.transaction("reservations").objectStore("reservations").getAll();
      request.onsuccess = () => resolve(request.result.map((item: Reservation) => ({ ...item, code: item.code ?? item.id.replace(/-/g, "").slice(0,8).toUpperCase() })));
      request.onerror = () => reject(request.error);
    });
    if (version === revision && !snapshot.pending && !unsaved) snapshot = { ...snapshot, reservations, loaded: true, error: "" };
  } catch { snapshot = { ...snapshot, loaded: true, error: "Não foi possível carregar as reservas neste navegador." }; }
  emit();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (!snapshot.loaded) void load();
    const refresh = () => { if (!snapshot.pending && !unsaved) void load(); };
    window.addEventListener("focus", refresh);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("viniszofx-reservations") : undefined;
    if (channel) channel.onmessage = refresh;
    dispose = () => { window.removeEventListener("focus", refresh); channel?.close(); };
  }
  return () => { listeners.delete(listener); if (!listeners.size) { dispose?.(); dispose = undefined; } };
}
function persist(reservations: Reservation[], notice?: string) {
  revision++; unsaved = true;
  snapshot = { ...snapshot, reservations, pending: snapshot.pending + 1, error: "" }; emit();
  queue = queue.then(async () => {
    const database = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("reservations", "readwrite");
      const store = tx.objectStore("reservations"); store.clear(); reservations.forEach(reservation => store.put(reservation));
      tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
    });
    if (snapshot.reservations === reservations) { unsaved = false; snapshot = { ...snapshot, error: "" }; }
    if (notice) notifySuccess(notice);
    if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("viniszofx-reservations"); channel.postMessage("changed"); channel.close(); }
  }).catch(() => { snapshot = { ...snapshot, error: "Não foi possível salvar as reservas. Tente novamente." }; notifyError("Falha ao salvar", "Não foi possível salvar as reservas. Tente novamente."); })
    .finally(() => { snapshot = { ...snapshot, pending: snapshot.pending - 1 }; emit(); });
}
export function useReservations() { return useSyncExternalStore(subscribe, () => snapshot, () => initial); }
export function saveReservation(fields: ReservationFields, id?: string) {
  if (!snapshot.loaded) return;
  const previous = snapshot.reservations.find(reservation => reservation.id === id);
  const now = new Date().toISOString();
  const generateId = () => typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2,"0")).join("");
  let reservationId = previous?.id ?? generateId();let code = previous?.code ?? reservationId.replace(/-/g, "").slice(0,8).toUpperCase();
  if(!previous) while(snapshot.reservations.some(item=>item.code===code)) { reservationId=generateId();code=reservationId.replace(/-/g, "").slice(0,8).toUpperCase(); }
  const reservation: Reservation = { ...fields, id: reservationId, code, createdAt: previous?.createdAt ?? now, updatedAt: now };
  persist(previous ? snapshot.reservations.map(item => item.id === previous.id ? reservation : item) : [...snapshot.reservations, reservation], previous ? "Reserva atualizada" : "Reserva cadastrada");
}
export function deleteReservation(id: string) { persist(snapshot.reservations.filter(reservation => reservation.id !== id), "Reserva excluída"); }
export function retryReservations() { if (unsaved) persist(snapshot.reservations); else void load(); }
export function matchesReservation(reservation: Reservation, query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const text = normalize([reservation.code, reservation.name, reservation.phone, addressText(reservation), reservation.address, reservation.departureDate, reservation.returnDate, reservation.notes].join(" "));
  return normalize(query.trim()).split(/\s+/).filter(Boolean).every(term => text.includes(term));
}
