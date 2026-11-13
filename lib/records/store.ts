"use client";

import { useSyncExternalStore } from "react";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";
import { readCollection, writeCollection } from "@/lib/storage/collections";
import type { CollectionKind } from "@/lib/storage/file-refs";

export type RecordMeta = { id: string; code: string; createdAt: string; updatedAt: string };
export type StoredRecord<F> = F & RecordMeta;
type Snapshot<F> = { records: StoredRecord<F>[]; loaded: boolean; pending: number; error: string };
type Messages = { created: string; updated: string; deleted: string; plural: string };

export function newId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
}

/** Drops the generated metadata so a record can be saved again. */
export function fieldsOf<F extends object>(record: StoredRecord<F> | Record<string, unknown>): F {
  const fields: Record<string, unknown> = { ...record };
  for (const key of ["id", "code", "createdAt", "updatedAt"]) delete fields[key];
  return fields as F;
}

export function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");
}

export function matchesText(values: unknown[], query: string) {
  const text = normalizeText(values.filter(value => typeof value === "string" || typeof value === "number").join(" "));
  return normalizeText(query.trim()).split(/\s+/).filter(Boolean).every(term => text.includes(term));
}

// Server-backed collection with the same queueing, focus refresh and
// cross-tab broadcast as the original feature stores.
export function createRecordStore<F extends object>(kind: CollectionKind, messages: Messages, options: { lazyFiles?: boolean } = {}) {
  const initial: Snapshot<F> = { records: [], loaded: false, pending: 0, error: "" };
  let snapshot = initial;
  let queue = Promise.resolve();
  let revision = 0;
  let unsaved = false;
  const listeners = new Set<() => void>();
  const noSubscribe = () => () => {};
  const channelName = `viniszofx-${kind}`;
  let dispose: (() => void) | undefined;
  const emit = () => listeners.forEach(listener => listener());

  async function load() {
    const version = revision;
    try {
      const records = await readCollection<StoredRecord<F>>(kind, undefined, { hydrate: !options.lazyFiles });
      if (version === revision && !snapshot.pending && !unsaved) snapshot = { ...snapshot, records, loaded: true, error: "" };
    } catch { snapshot = { ...snapshot, loaded: true, error: `Não foi possível carregar ${messages.plural}.` }; }
    emit();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) {
      if (!snapshot.loaded) void load();
      const refresh = () => { if (!snapshot.pending && !unsaved) void load(); };
      window.addEventListener("focus", refresh);
      // Sem fila offline: ao voltar a conexão, reenvia o que ficou sem salvar.
      const reconnect = () => { if (unsaved && !snapshot.pending) persist(snapshot.records); else refresh(); };
      window.addEventListener("online", reconnect);
      const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(channelName) : undefined;
      if (channel) channel.onmessage = refresh;
      dispose = () => { window.removeEventListener("focus", refresh); window.removeEventListener("online", reconnect); channel?.close(); };
    }
    return () => { listeners.delete(listener); if (!listeners.size) { dispose?.(); dispose = undefined; } };
  }

  function persist(records: StoredRecord<F>[], notice?: string) {
    revision++; unsaved = true;
    snapshot = { ...snapshot, records, pending: snapshot.pending + 1, error: "" }; emit();
    queue = queue.then(async () => {
      await writeCollection(kind, records);
      if (snapshot.records === records) { unsaved = false; snapshot = { ...snapshot, error: "" }; }
      if (notice) notifySuccess(notice);
      if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel(channelName); channel.postMessage("changed"); channel.close(); }
    }).catch(() => {
      snapshot = { ...snapshot, error: `Não foi possível salvar ${messages.plural}. Tente novamente.` };
      notifyError("Falha ao salvar", `Não foi possível salvar ${messages.plural}. Tente novamente.`);
    }).finally(() => { snapshot = { ...snapshot, pending: snapshot.pending - 1 }; emit(); });
  }

  function save(fields: F, id?: string, options?: { silent?: boolean; keepUpdatedAt?: boolean }) {
    if (!snapshot.loaded) return undefined;
    const previous = snapshot.records.find(record => record.id === id);
    const now = new Date().toISOString();
    let recordId = previous?.id ?? id ?? newId();
    let code = previous?.code ?? recordId.replace(/-/g, "").slice(0, 8).toUpperCase();
    if (!previous) while (snapshot.records.some(item => item.code === code)) { recordId = newId(); code = recordId.replace(/-/g, "").slice(0, 8).toUpperCase(); }
    const record = { ...fields, id: recordId, code, createdAt: previous?.createdAt ?? now, updatedAt: options?.keepUpdatedAt && previous ? previous.updatedAt : now } as StoredRecord<F>;
    persist(previous ? snapshot.records.map(item => item.id === previous.id ? record : item) : [...snapshot.records, record],
      options?.silent ? undefined : previous ? messages.updated : messages.created);
    return record;
  }

  /** Saves several records in one write, e.g. a stock movement and its balance check. */
  function replaceAll(records: StoredRecord<F>[], notice?: string) { persist(records, notice); }
  function remove(id: string) { persist(snapshot.records.filter(record => record.id !== id), messages.deleted); }
  function retry() { if (unsaved) persist(snapshot.records); else void load(); }
  function useRecords(enabled = true) { return useSyncExternalStore(enabled ? subscribe : noSubscribe, () => snapshot, () => initial); }
  function current() { return snapshot.records; }

  return { useRecords, save, remove, retry, replaceAll, current };
}

export type RecordStore<F extends object> = ReturnType<typeof createRecordStore<F>>;
