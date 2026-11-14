"use client";

// Cópia das conversas neste aparelho: sem sinal, a lista e as conversas abrem com o que foi visto por último.
// Só leitura (enviar exige conexão). Sai junto com a sessão: o "Sair" apaga tudo que começa com o prefixo.

export const offlinePrefix = "viniszofx:dm:";
type Copy<T> = { data: T; savedAt: string };
const MAX_MESSAGES = 60;

const key = (me: string, path: string) => `${offlinePrefix}${me}:${path}`;

export function saveCopy(me: string, path: string, data: unknown) {
  if (!me) return;
  try {
    const value = Array.isArray(data) && path.startsWith("thread:") ? data.slice(-MAX_MESSAGES) : data;
    localStorage.setItem(key(me, path), JSON.stringify({ data: value, savedAt: new Date().toISOString() } satisfies Copy<unknown>));
    localStorage.setItem(`${offlinePrefix}me`, me);
  } catch { /* armazenamento cheio ou bloqueado: segue sem cópia */ }
}

export function readCopy<T>(path: string): Copy<T> | null {
  try {
    const me = localStorage.getItem(`${offlinePrefix}me`);
    const raw = me ? localStorage.getItem(key(me, path)) : null;
    return raw ? JSON.parse(raw) as Copy<T> : null;
  } catch { return null; }
}

/** Falha de rede (sem sinal), e não erro do servidor. */
export const isNetworkError = (cause: unknown) => (typeof navigator !== "undefined" && navigator.onLine === false) || (cause instanceof TypeError && /fetch|network|load failed/i.test(cause.message));

/** Apaga as cópias deste aparelho (ao sair da conta). */
export function clearCopies() {
  try { for (const name of Object.keys(localStorage)) if (name.startsWith(offlinePrefix) || name.startsWith("viniszofx:dm-theme:")) localStorage.removeItem(name); } catch { /* nada a apagar */ }
}

export const sinceLabel = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
