"use client";

import type { AddressFieldsValue } from "@/lib/format/address";
import { createRecordStore } from "@/lib/records/store";

// Perfil da empresa da conta: no Nodus são os ajustes da organização (endereço
// de origem das viagens, identificação nas impressões e cores dos serviços).
export type CompanyFields = AddressFieldsValue & {
  name: string; document: string; phone: string; email: string; responsible: string;
  serviceColors: Record<string, string>;
  whatsappGuidelines?: string;
};
export const companyId = "company";
export const emptyCompany: CompanyFields = { name: "", document: "", phone: "", email: "", responsible: "", serviceColors: {} };
export const companyStore = createRecordStore<CompanyFields>("settings", { created: "Ajustes salvos", updated: "Ajustes salvos", deleted: "Ajustes removidos", plural: "os ajustes" });

export function useCompany() {
  const snapshot = companyStore.useRecords();
  const record = snapshot.records.find(item => item.id === companyId);
  return { ...snapshot, company: { ...emptyCompany, ...record } as CompanyFields, saved: !!record };
}
export function currentCompany(): CompanyFields {
  return { ...emptyCompany, ...companyStore.current().find(item => item.id === companyId) };
}
export function saveCompany(fields: CompanyFields, options?: { silent?: boolean }) {
  return companyStore.save(fields, companyId, options);
}
