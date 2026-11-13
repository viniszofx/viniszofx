"use client";
import { useEffect, useState } from "react";

/** A string choice remembered in localStorage, restored after mount to keep hydration stable. */
export function usePreference<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    const saved = localStorage.getItem(key) as T | null;
    if (saved && allowed.includes(saved)) queueMicrotask(() => setValue(saved));
    // `allowed` is a literal list; restoring once per key is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, (next: T) => { setValue(next); localStorage.setItem(key, next); }] as const;
}
