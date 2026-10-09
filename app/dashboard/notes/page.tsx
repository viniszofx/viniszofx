import type { Metadata } from "next";
import { NotesPage } from "@/components/notes/notes-page";

export const metadata: Metadata = { title: "Notes | Viniccius" };

export default async function NotesRoute({ searchParams }: { searchParams: Promise<{ q?: string | string[]; note?: string | string[] }> }) {
  const { q, note } = await searchParams;
  const search = typeof q === "string" ? q : "";
  const noteId = typeof note === "string" ? note : "";
  return <NotesPage key={`${search}:${noteId}`} initialSearch={search} initialNoteId={noteId} />;
}
