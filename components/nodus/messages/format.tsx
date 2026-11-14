"use client";
// Formatos, separador de dia, destaque da busca e respostas do servidor das Mensagens.
import type { Message } from "./dialogs";

export const time = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const dayFormatYear = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });
export const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🎉"];
// No celular, Enter quebra a linha (como nos apps de conversa); no computador, envia.
export const touchKeyboard = () => window.matchMedia("(pointer: coarse)").matches;
export const sameDay = (a: string, b?: string) => !!b && new Date(a).toDateString() === new Date(b).toDateString();
export const previewOf = (message: Message) => message.body || message.attachments[0]?.name || (message.contact ? `👤 ${message.contact.name}` : "");

export async function failure(response: Response) {
  if (response.status === 401) return "Entre em uma organização para acessar as mensagens.";
  // Só mostra o texto do servidor quando é uma frase nossa (não HTML de erro nem "Internal Server Error").
  const text = (await response.text().catch(() => "")).trim();
  const own = text && text.length < 300 && !text.startsWith("<") && !/internal server error|^error$/i.test(text) ? text : "";
  if (response.status === 403) return own || "Sua conta tem acesso somente para leitura.";
  if (response.status === 404) return own || "Essa pessoa não está mais disponível nesta organização.";
  if (response.status === 413) return "O arquivo é grande demais para enviar.";
  if (response.status >= 500) return "O servidor teve um problema. Tente de novo em instantes.";
  return own || "Não foi possível concluir a solicitação. Tente novamente.";
}
/** Junta a página mais recente com as anteriores já carregadas, sem duplicar. */
export function merge(current: Message[], incoming: Message[]) {
  const map = new Map(current.map(item => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Separador de dia, como no Telegram: fica preso no topo enquanto o dia rola.
export function DaySeparator({ date }: { date: string }) {
  const value = new Date(date);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const label = value.toDateString() === today.toDateString() ? "Hoje"
    : value.toDateString() === yesterday.toDateString() ? "Ontem"
    : (value.getFullYear() === today.getFullYear() ? dayFormat : dayFormatYear).format(value);
  return <div role="separator" aria-label={label} className="pointer-events-none sticky top-17 z-[5] flex justify-center py-1">
    <time dateTime={date} className="glass-float inline-block rounded-full border px-3 py-0.5 text-xs font-medium first-letter:uppercase">{label}</time>
  </div>;
}

// Destaca o trecho buscado no resultado.
export function Highlight({ text, term }: { text: string; term: string }) {
  const index = text.toLocaleLowerCase("pt-BR").indexOf(term.toLocaleLowerCase("pt-BR"));
  if (index < 0) return <>{text}</>;
  const start = Math.max(0, index - 40);
  return <>{start > 0 && "…"}{text.slice(start, index)}<mark className="rounded bg-amber-300/70 px-0.5 text-inherit dark:bg-amber-400/40">{text.slice(index, index + term.length)}</mark>{text.slice(index + term.length)}</>;
}

