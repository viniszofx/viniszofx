"use client";
// Peças de salvar compartilhadas pelos editores do Drive (DOCX e XLSX).
import { useState } from "react";
import { RiSaveLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/** Espera depois da última alteração antes de salvar sozinho. */
export const AUTO_SAVE_DELAY = 1500;
const clock = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** "Salvar automaticamente", guardado neste aparelho por tipo de editor. */
export function useAutoSavePreference(key: string) {
  const [autoSave, setAutoSave] = useState(() => {
    try { return window.localStorage.getItem(key) === "on"; } catch { return false; }
  });
  function persist(next: boolean) {
    setAutoSave(next);
    try { window.localStorage.setItem(key, next ? "on" : "off"); } catch { /* A preferência vale só nesta sessão. */ }
  }
  return [autoSave, persist] as const;
}

export function saveStatus(busy: boolean, dirty: boolean, savedAt?: Date | null) {
  return busy ? "Salvando…" : dirty ? "Alterações não salvas" : savedAt ? `Salvo às ${clock.format(savedAt)}` : "";
}

/** Situação, "Salvar automaticamente" e o botão Salvar, na mesma ordem em todos os editores. */
export function SaveControls({ status, autoSave, onAutoSave, canSave, onSave, ready, label = "Salvar", children }: {
  status: string;
  autoSave?: boolean;
  /** Sem esta função, o interruptor de salvamento automático não aparece. */
  onAutoSave?: (next: boolean) => void;
  canSave: boolean;
  onSave?: () => void;
  ready: boolean;
  label?: string;
  /** Ações do editor (imprimir, exportar, baixar), entre o interruptor e o Salvar. */
  children?: React.ReactNode;
}) {
  return <>
    <span role="status" className="px-1 text-xs text-muted-foreground">{status}</span>
    {onAutoSave && <Switch checked={!!autoSave} onChange={onAutoSave} label="Salvar automaticamente" disabled={!ready} />}
    {children}
    {onSave && <Button type="button" size="sm" disabled={!ready || !canSave} onClick={onSave}><RiSaveLine className="size-4" />{label}</Button>}
  </>;
}
