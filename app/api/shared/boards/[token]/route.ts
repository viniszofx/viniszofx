import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { boards } from "@/lib/db/schema/app";

type Context = { params: Promise<{ token: string }> };
type Card = { id: string; title: string; description?: string; completed?: boolean; color?: string; labels?: unknown[]; due?: string; priority?: string; checklists?: { items: { done: boolean }[] }[] };
type Board = { title: string; description?: string; color?: string; lists?: { id: string; title: string; color?: string; cards: Card[] }[] };

/** Leitura pública de um quadro pelo link (Nodus: link de visualização). Sem anexos nem comentários. */
export async function GET(_request: Request, context: Context) {
  const { token } = await context.params;
  if (!/^[0-9a-f]{36}$/.test(token)) return new Response(null, { status: 404 });
  const [row] = await db.select({ data: boards.data }).from(boards).where(sql`${boards.data}->>'shareToken' = ${token}`).limit(1);
  const board = row?.data as Board | undefined;
  if (!board) return new Response(null, { status: 404 });
  return Response.json({
    title: board.title, description: board.description ?? "", color: board.color ?? "",
    lists: (board.lists ?? []).map(list => ({ id: list.id, title: list.title, color: list.color ?? "", cards: list.cards.map(card => {
      const items = card.checklists?.flatMap(checklist => checklist.items) ?? [];
      return { id: card.id, title: card.title, description: card.description ?? "", completed: !!card.completed, color: card.color ?? "", labels: card.labels ?? [], due: card.due ?? "", priority: card.priority ?? "", checklist: items.length ? { done: items.filter(item => item.done).length, total: items.length } : null };
    }) })),
  }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
