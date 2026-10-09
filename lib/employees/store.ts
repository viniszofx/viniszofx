"use client";

import type { CardAttachment } from "@/lib/boards/store";
import { addressText, type AddressFieldsValue } from "@/lib/format/address";
import { useSyncExternalStore } from "react";
import { notifySuccess, notifyError } from "@/lib/ui/notifications";

export type EmployeeFields = AddressFieldsValue & { status?: "active" | "terminated"; attachments?: CardAttachment[]; name: string; department: string; role: string; email: string; phone: string; address: string; notes: string };
export type Employee = EmployeeFields & { id: string; code: string; createdAt: string; updatedAt: string };
type Snapshot = { employees: Employee[]; loaded: boolean; pending: number; error: string };
const initial: Snapshot = { employees: [], loaded: false, pending: 0, error: "" };
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
    const request = indexedDB.open("viniszofx-employees", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("employees", { keyPath: "id" });
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
    request.onerror = () => { database = undefined; reject(request.error); };
  });
  return database;
}
async function load() {
  const version = revision;
  try {
    const database = await db();
    const employees = await new Promise<Employee[]>((resolve, reject) => {
      const request = database.transaction("employees").objectStore("employees").getAll();
      request.onsuccess = () => resolve(request.result.map((employee: Employee) => ({ ...employee, code: employee.code ?? employee.id.replace(/-/g, "").slice(0, 8).toUpperCase() })));
      request.onerror = () => reject(request.error);
    });
    if (version === revision && !snapshot.pending && !unsaved) snapshot = { ...snapshot, employees, loaded: true, error: "" };
  } catch { snapshot = { ...snapshot, loaded: true, error: "Não foi possível carregar os empregados neste navegador." }; }
  emit();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (!snapshot.loaded) void load();
    const refresh = () => { if (!snapshot.pending && !unsaved) void load(); };
    window.addEventListener("focus", refresh);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("viniszofx-employees") : undefined;
    if (channel) channel.onmessage = refresh;
    dispose = () => { window.removeEventListener("focus", refresh); channel?.close(); };
  }
  return () => { listeners.delete(listener); if (!listeners.size) { dispose?.(); dispose = undefined; } };
}
function persist(employees: Employee[], notice?: string) {
  revision++; unsaved = true;
  snapshot = { ...snapshot, employees, pending: snapshot.pending + 1, error: "" }; emit();
  queue = queue.then(async () => {
    const database = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("employees", "readwrite");
      const store = tx.objectStore("employees"); store.clear(); employees.forEach(employee => store.put(employee));
      tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
    });
    if (snapshot.employees === employees) { unsaved = false; snapshot = { ...snapshot, error: "" }; }
    if (notice) notifySuccess(notice);
    if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("viniszofx-employees"); channel.postMessage("changed"); channel.close(); }
  }).catch(() => { snapshot = { ...snapshot, error: "Não foi possível salvar os empregados. Tente novamente." }; notifyError("Falha ao salvar", "Não foi possível salvar os empregados. Tente novamente."); })
    .finally(() => { snapshot = { ...snapshot, pending: snapshot.pending - 1 }; emit(); });
}
export function useEmployees() { return useSyncExternalStore(subscribe, () => snapshot, () => initial); }
export function saveEmployee(fields: EmployeeFields, id?: string) {
  if (!snapshot.loaded) return;
  const previous = snapshot.employees.find(employee => employee.id === id);
  const now = new Date().toISOString();
  const generateId = () => typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
  let employeeId = previous?.id ?? generateId();
  let code = previous?.code ?? employeeId.replace(/-/g, "").slice(0, 8).toUpperCase();
  if (!previous) while (snapshot.employees.some(item => item.code === code)) { employeeId = generateId(); code = employeeId.replace(/-/g, "").slice(0, 8).toUpperCase(); }
  const employee: Employee = { ...fields, id: employeeId, code, createdAt: previous?.createdAt ?? now, updatedAt: now };
  persist(previous ? snapshot.employees.map(item => item.id === previous.id ? employee : item) : [...snapshot.employees, employee], previous ? "Empregado atualizado" : "Empregado cadastrado");
}
export function deleteEmployee(id: string) { persist(snapshot.employees.filter(employee => employee.id !== id), "Empregado excluído"); }
export function retryEmployees() { if (unsaved) persist(snapshot.employees); else void load(); }
export function matchesEmployee(employee: Employee, query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const text = normalize([employee.code, employee.status === "terminated" ? "Desligado" : "Ativo", addressText(employee), employee.attachments?.map(file => file.name).join(" "), employee.name, employee.department, employee.role, employee.email, employee.phone, employee.address, employee.notes].join(" "));
  return normalize(query.trim()).split(/\s+/).filter(Boolean).every(term => text.includes(term));
}
