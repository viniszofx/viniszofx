import type { Metadata } from "next";
import { BoardPage } from "@/components/boards/board-page";
export const metadata: Metadata = { title: "Board | Viniccius" };
export default async function Page({ params, searchParams }: { params: Promise<{ boardId: string }>; searchParams: Promise<{ card?: string | string[] }> }) {
  const [{ boardId }, { card }] = await Promise.all([params, searchParams]);
  const cardId = typeof card === "string" ? card : "";
  return <BoardPage key={`${boardId}:${cardId}`} boardId={boardId} initialCardId={cardId} />;
}
