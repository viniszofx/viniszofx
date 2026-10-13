"use client";

import { vehicleIdentification } from "./identity";
import type { CardAttachment } from "@/lib/boards/store";
import { useSyncExternalStore } from "react";
import { notifySuccess, notifyError } from "@/lib/ui/notifications";
import { readCollection, writeCollection } from "@/lib/storage/collections";

export type VehicleFields = { renavam?: string; chassis?: string; attachments?: CardAttachment[]; color?: string; purchaseValue?: string; appraisalValue?: string; costPerLiter?: string; name: string; plate: string; brand: string; model: string; year: string; type: string; notes: string };
export type Vehicle = VehicleFields & { id: string; code: string; createdAt: string; updatedAt: string };
type Snapshot = { vehicles: Vehicle[]; loaded: boolean; pending: number; error: string };
const initial: Snapshot = { vehicles: [], loaded: false, pending: 0, error: "" };
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
    const request = indexedDB.open("viniszofx-fleet", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("vehicles", { keyPath: "id" });
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
    request.onerror = () => { database = undefined; reject(request.error); };
  });
  return database;
}
async function load() {
  const version = revision;
  try {
    const vehicles = await readCollection("vehicles", async () => {
      const database = await db();
      return new Promise<Vehicle[]>((resolve, reject) => {
      const request = database.transaction("vehicles").objectStore("vehicles").getAll();
      request.onsuccess = () => resolve(request.result.map((vehicle: Vehicle) => ({ ...vehicle, code: vehicle.code ?? shortCode(vehicle.id), name: vehicleIdentification(vehicle) })));
      request.onerror = () => reject(request.error);
      });
    });
    if (version === revision && !snapshot.pending && !unsaved) snapshot = { ...snapshot, vehicles, loaded: true, error: "" };
  } catch { snapshot = { ...snapshot, loaded: true, error: "Não foi possível carregar os veículos neste navegador." }; }
  emit();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (!snapshot.loaded) void load();
    const refresh = () => { if (!snapshot.pending && !unsaved) void load(); };
    window.addEventListener("focus", refresh);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("viniszofx-fleet") : undefined;
    if (channel) channel.onmessage = refresh;
    dispose = () => { window.removeEventListener("focus", refresh); channel?.close(); };
  }
  return () => { listeners.delete(listener); if (!listeners.size) { dispose?.(); dispose = undefined; } };
}
function persist(vehicles: Vehicle[], notice?: string) {
  revision++; unsaved = true;
  snapshot = { ...snapshot, vehicles, pending: snapshot.pending + 1, error: "" }; emit();
  queue = queue.then(async () => {
    await writeCollection("vehicles", vehicles);
    if (snapshot.vehicles === vehicles) { unsaved = false; snapshot = { ...snapshot, error: "" }; }
    if (notice) notifySuccess(notice);
    if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("viniszofx-fleet"); channel.postMessage("changed"); channel.close(); }
  }).catch(() => { snapshot = { ...snapshot, error: "Não foi possível salvar os veículos. Tente novamente." }; notifyError("Falha ao salvar", "Não foi possível salvar os veículos. Tente novamente."); })
    .finally(() => { snapshot = { ...snapshot, pending: snapshot.pending - 1 }; emit(); });
}
export function useVehicles() { return useSyncExternalStore(subscribe, () => snapshot, () => initial); }
function shortCode(id: string) { return id.replace(/-/g, "").slice(0, 8).toUpperCase(); }
function newVehicleId() { return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join(""); }
export function saveVehicle(fields: VehicleFields, id?: string) {
  if (!snapshot.loaded) return;
  const previous = snapshot.vehicles.find(vehicle => vehicle.id === id);
  const now = new Date().toISOString();
  let vehicleId = previous?.id ?? newVehicleId();
  let code = previous?.code ?? shortCode(vehicleId);
  if (!previous) { while (snapshot.vehicles.some(vehicle => vehicle.code === code)) { vehicleId = newVehicleId(); code = shortCode(vehicleId); } }
  const vehicle: Vehicle = { ...fields, name: vehicleIdentification(fields), id: vehicleId, code, createdAt: previous?.createdAt ?? now, updatedAt: now };
  persist(previous ? snapshot.vehicles.map(item => item.id === previous.id ? vehicle : item) : [...snapshot.vehicles, vehicle], previous ? "Veículo atualizado" : "Veículo cadastrado");
}
export function deleteVehicle(id: string) { persist(snapshot.vehicles.filter(vehicle => vehicle.id !== id), "Veículo excluído"); }
export function retryVehicles() { if (unsaved) persist(snapshot.vehicles); else void load(); }
export function matchesVehicle(vehicle: Vehicle, query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const text = normalize([vehicle.code, vehicle.name, vehicle.plate, vehicle.brand, vehicle.model, vehicle.year, vehicle.type, vehicle.color, vehicle.renavam, vehicle.chassis, vehicle.notes, vehicle.attachments?.map(file => file.name).join(" ")].join(" "));
  return normalize(query.trim()).split(/\s+/).filter(Boolean).every(term => text.includes(term));
}
