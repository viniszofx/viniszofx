"use client";
import { useMemo, useSyncExternalStore } from "react";
type Resource = { subscribe: (listener: () => void) => () => void; snapshot: () => string | undefined };
const resources = new WeakMap<Blob, Resource>();
function resourceFor(blob: Blob): Resource {
  const existing = resources.get(blob);
  if (existing) return existing;
  let url: string | undefined;
  const listeners = new Set<() => void>();
  const resource = {
    snapshot: () => url,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!url) { url = URL.createObjectURL(blob);listeners.forEach(notify => notify()); }
      return () => {
        listeners.delete(listener);
        if (!listeners.size && url) { URL.revokeObjectURL(url);url = undefined; }
      };
    },
  };
  resources.set(blob, resource);
  return resource;
}
const serverSnapshot = () => undefined;
export function useObjectUrl(blob: Blob) {
  const resource = useMemo(() => resourceFor(blob), [blob]);
  return useSyncExternalStore(resource.subscribe, resource.snapshot, serverSnapshot);
}
