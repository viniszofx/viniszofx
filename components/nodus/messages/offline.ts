"use client";
import { clearChatThemes } from "./chat-theme";

// Como no Nodus: cópia das conversas neste aparelho (sem sinal, a lista e as conversas abrem com o que
// foi visto por último) e fila de envio (o que for escrito sem sinal sai quando a conexão voltar).
// Tudo sai junto com a sessão: o "Sair" apaga o que começa com o prefixo.

export const offlinePrefix = "viniszofx:dm:";
type Copy<T> = { data: T; savedAt: string };
const MAX_MESSAGES = 150;

const key = (me: string, path: string) => `${offlinePrefix}${me}:${path}`;
const currentUser = () => { try { return localStorage.getItem(`${offlinePrefix}me`) ?? ""; } catch { return ""; } };

export function saveCopy(me: string, path: string, data: unknown) {
  if (!me) return;
  try {
    localStorage.setItem(key(me, path), JSON.stringify({ data, savedAt: new Date().toISOString() } satisfies Copy<unknown>));
    localStorage.setItem(`${offlinePrefix}me`, me);
  } catch { /* armazenamento cheio ou bloqueado: segue sem cópia */ }
}

export function saveThreadCopy(me: string, peerId: string, data: { messages: unknown[]; thread: unknown }) {
  saveCopy(me, `thread:${peerId}`, { ...data, messages: data.messages.slice(-MAX_MESSAGES) });
}

export function readCopy<T>(path: string): Copy<T> | null {
  try {
    const me = currentUser();
    const raw = me ? localStorage.getItem(key(me, path)) : null;
    return raw ? JSON.parse(raw) as Copy<T> : null;
  } catch { return null; }
}

/** Falha de rede (sem sinal), e não erro do servidor. */
export const isNetworkError = (cause: unknown) => (typeof navigator !== "undefined" && navigator.onLine === false) || (cause instanceof TypeError && /fetch|network|load failed/i.test(cause.message));

/** Envio que espera a conexão: texto, contato ou encaminhamento (arquivos precisam de sinal para subir). */
export type Outgoing = { id: string; peerId: string; payload: Record<string, unknown>; createdAt: string; status: "waiting" | "sending" | "failed"; error?: string; preview: { body: string; replyTo: { id: string; mine: boolean; body: string } | null; forwarded: boolean } };

export function readOutbox(): Outgoing[] {
  const me = currentUser();
  if (!me) return [];
  try { return JSON.parse(localStorage.getItem(key(me, "outbox")) ?? "[]") as Outgoing[]; } catch { return []; }
}
export function writeOutbox(items: Outgoing[]) {
  const me = currentUser();
  if (!me) return;
  try { localStorage.setItem(key(me, "outbox"), JSON.stringify(items)); } catch { /* sem espaço: a fila fica só na memória */ }
}

/** Apaga as cópias, a fila e os temas deste aparelho (ao sair da conta). */
export function clearCopies() {
  try { for (const name of Object.keys(localStorage)) if (name.startsWith(offlinePrefix)) localStorage.removeItem(name); } catch { /* nada a apagar */ }
  clearChatThemes();
}

export const sinceLabel = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
