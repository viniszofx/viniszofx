"use client";
import { useCallback, useSyncExternalStore } from "react";
type Preferences = Record<string, boolean>;
const empty: Preferences = {};
const cache = new Map<string, Preferences>();
const listeners = new Map<string, Set<() => void>>();
function read(key: string): Preferences {
 if (cache.has(key)) return cache.get(key)!;
 let result: Preferences = empty;
 try {
  const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "{}");
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) result = Object.fromEntries(Object.entries(parsed).filter(([,value]) => typeof value === "boolean"));
 } catch { /* Keep the sections usable when browser storage is unavailable. */ }
 cache.set(key, result); return result;
}
function write(key: string, value: Preferences) {
 cache.set(key, value);
 try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Retain preferences for this session. */ }
 listeners.get(key)?.forEach(listener => listener());
}
export function useSectionPreferences(key: string) {
 const subscribe = useCallback((listener: () => void) => {
  const group = listeners.get(key) ?? new Set<() => void>(); listeners.set(key, group); group.add(listener);
  const refresh = (event: StorageEvent) => { if (event.key === key || event.key === null) { cache.delete(key); group.forEach(callback => callback()); } };
  window.addEventListener("storage", refresh);
  return () => { group.delete(listener); if (!group.size) listeners.delete(key); window.removeEventListener("storage", refresh); };
 }, [key]);
 const getSnapshot = useCallback(() => read(key), [key]);
 const preferences = useSyncExternalStore(subscribe, getSnapshot, () => empty);
 return { isOpen: (title: string) => preferences[title] ?? preferences["*"] ?? true,
  setOpen: (title: string, open: boolean) => { const current = read(key); if ((current[title] ?? current["*"] ?? true) !== open) write(key, { ...current, [title]: open }); },
  collapseAll: () => write(key, { "*": false }) };
}
