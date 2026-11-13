"use client";
import { companyStore, type CompanyFields } from "./company";

// Atalhos do menu do celular escolhidos por cada pessoa (Nodus: MenuShortcuts).
// Ficam na coleção de ajustes da conta, então valem em todos os aparelhos.
const shortcutsId = "menu-shortcuts";
export const defaultShortcuts = ["/dashboard/todos", "/dashboard/calendar", "/dashboard/notes", "/dashboard/drive", "/dashboard/settings"];
export const maxShortcuts = 12;

export function useMenuShortcuts() {
  const snapshot = companyStore.useRecords();
  const record = snapshot.records.find(item => item.id === shortcutsId) as unknown as { hrefs?: unknown } | undefined;
  const hrefs = Array.isArray(record?.hrefs) ? record.hrefs.filter((href): href is string => typeof href === "string") : defaultShortcuts;
  return { loaded: snapshot.loaded, hrefs };
}

export function saveMenuShortcuts(hrefs: string[]) {
  // Mesmo store da empresa: a coleção `settings` guarda um registro por ajuste.
  return companyStore.save({ hrefs: hrefs.slice(0, maxShortcuts) } as unknown as CompanyFields, shortcutsId, { silent: true });
}
