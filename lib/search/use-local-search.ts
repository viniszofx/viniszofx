"use client";
import { useEffect, useState } from "react";
import { useBoards } from "@/lib/boards/store";
import { listNotes } from "@/lib/notes/storage";
import type { Note } from "@/lib/notes/types";
export type SearchEntry = { id: string; title: string; context: string; text: string; href: string; kind: "Notes" | "Boards" | "Listas" | "Cards" | "Páginas" };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
export function useLocalSearch(query: string) {
  const { boards, loaded, error: boardError } = useBoards();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => { void listNotes().then(items => { if (active) { setNotes(items); setError(""); } }).catch(() => { if (active) setError("Não foi possível consultar Notes neste navegador."); }); };
    refresh();window.addEventListener("focus", refresh);window.addEventListener("viniszofx:notes-changed", refresh);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("viniszofx-notes") : undefined;
    if (channel) channel.onmessage = refresh;
    return () => { active = false;window.removeEventListener("focus", refresh);window.removeEventListener("viniszofx:notes-changed", refresh);channel?.close(); };
  }, []);
  const entries: SearchEntry[] = (notes ?? []).map(note => ({ id: note.id, title: note.title || "Sem título", context: "Nota pessoal", text: `${note.title} ${note.content}`, href: `/dashboard/notes?note=${encodeURIComponent(note.id)}`, kind: "Notes" }));
  boards.forEach(board => {
    entries.push({ id: board.id, title: board.title, context: `${board.lists.length} listas`, text: board.title, href: `/dashboard/boards/${board.id}`, kind: "Boards" });
    board.lists.forEach(list => {
      entries.push({ id: list.id, title: list.title, context: board.title, text: `${board.title} ${list.title}`, href: `/dashboard/boards/${board.id}`, kind: "Listas" });
      list.cards.forEach(card => entries.push({ id: card.id, title: card.title, context: `${board.title} · ${list.title}`, text: `${card.title} ${card.description} ${board.title} ${list.title} ${card.attachments?.map(file => file.name).join(" ") ?? ""}`, href: `/dashboard/boards/${board.id}?card=${encodeURIComponent(card.id)}`, kind: "Cards" }));
    });
  });
  for (const [title, href, text] of [["Home", "/dashboard", "início painel"], ["Workspace", "/dashboard/workspace", "área de trabalho"], ["Notes", "/dashboard/notes", "notas anotações documentos"], ["Boards", "/dashboard/boards", "quadros tarefas"], ["Settings", "/dashboard/settings", "configurações preferências"]]) entries.push({ id: href, title, href, text: `${title} ${text}`, context: "Navegação", kind: "Páginas" });
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return { results: terms.length ? entries.filter(entry => terms.every(term => normalize(entry.text).includes(term))) : [], loaded: loaded && (notes !== null || !!error), error: error || boardError };
}
