"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hasPendingDraft, saveNote, writeDraft } from "@/lib/notes/storage";
import type { Note } from "@/lib/notes/types";

export function useNoteAutosave(initial: Note) {
  const [note, setNote] = useState(initial);
  const [status, setStatus] = useState<"saved" | "pending" | "saving" | "error">("saved");
  const [error, setError] = useState("");
  const draft = useRef(initial);
  const saved = useRef(hasPendingDraft(initial.id) ? "" : JSON.stringify(initial));
  const flight = useRef<Promise<void> | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const flush = useCallback((): Promise<void> => {
    clearTimeout(timer.current);
    if (flight.current) return flight.current;
    const persist = async () => {
      try {
        while (saved.current !== JSON.stringify(draft.current)) {
          const snapshot = draft.current;
          if (mounted.current) { setStatus("saving"); setError(""); }
          await saveNote(snapshot);
          saved.current = JSON.stringify(snapshot);
        }
        if (mounted.current) setStatus("saved");
      } catch (cause) {
        if (mounted.current) { setStatus("error"); setError(cause instanceof Error ? cause.message : "Não foi possível salvar."); }
        throw cause;
      }
    };
    flight.current = persist().finally(() => { flight.current = undefined; });
    return flight.current;
  }, []);
  const update = useCallback((changes: Partial<Note>) => {
    draft.current = { ...draft.current, ...changes, updatedAt: new Date().toISOString() };
    writeDraft(draft.current);
    setNote(draft.current);
    setStatus("pending");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush().catch(() => {}); }, 350);
  }, [flush]);
  useEffect(() => {
    mounted.current = true;
    void flush().catch(() => {});
    const hidden = () => { if (document.visibilityState === "hidden") void flush().catch(() => {}); };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", hidden);
      void flush().catch(() => {});
    };
  }, [flush]);
  return { note, update, flush, status, error };
}
