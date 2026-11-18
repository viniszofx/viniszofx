"use client";
import { createRecordStore, type StoredRecord } from "@/lib/records/store";
import { today } from "@/lib/format/date";

// Proposta comercial no padrão da marca (docs/brand/Impressos.md e templates/proposta/proposta.html).
// Valores em reais ficam como texto decimal ("1500.00"), como no resto do app (parseBRLInput / formatBRL).
export type ProposalStatus = "draft" | "sent" | "accepted" | "declined";
export type ProposalStage = { title: string; deliverable: string; days: string; value: string };
export type ProposalChange = { before: string; after: string };
export type ProposalFields = {
  number: string;
  status: ProposalStatus;
  clientId: string;
  contactName: string;
  companyName: string;
  companyDocument: string;
  project: string;
  date: string;
  validityDays: string;
  /** 01 O que ouvimos: como o trabalho é feito hoje. */
  today: string;
  pains: string[];
  /** 02 A solução: uma frase sobre o resultado. */
  solution: string;
  changes: ProposalChange[];
  /** 03 Escopo e etapas. A última costuma ser "No ar e acompanhado". */
  stages: ProposalStage[];
  followUpDays: string;
  included: string[];
  excluded: string[];
  /** 06 Investimento e condições. */
  payment: string;
  paymentMethod: string;
  start: string;
  /** Anotações internas: não vão para o PDF. */
  notes: string;
};
export type Proposal = StoredRecord<ProposalFields>;

export const proposalStatuses: { value: ProposalStatus; label: string; color: string }[] = [
  { value: "draft", label: "Rascunho", color: "#9ca3af" },
  { value: "sent", label: "Enviada", color: "#e1a170" },
  { value: "accepted", label: "Aceita", color: "#16a34a" },
  { value: "declined", label: "Recusada", color: "#ef4444" },
];
export const proposalStatus = (value: ProposalStatus) => proposalStatuses.find(item => item.value === value) ?? proposalStatuses[0];

// Itens que o site promete em toda proposta; "{empresa}" vira o nome da empresa do cliente.
export const defaultIncluded = ["Código, documentação e acessos em nome de {empresa}.", "Treinamento da equipe que vai usar o sistema.", "Acompanhamento dos primeiros dias no ar."];

export const proposalStore = createRecordStore<ProposalFields>("proposals", { created: "Proposta criada", updated: "Proposta salva", deleted: "Proposta excluída", plural: "as propostas" });

/** Próximo número no formato AAAA-000, contando as propostas do ano. */
export function nextProposalNumber(existing: Pick<ProposalFields, "number">[], date = today()) {
  const year = date.slice(0, 4);
  const used = existing.map(item => item.number).filter(number => number.startsWith(`${year}-`)).map(number => Number(number.slice(5)) || 0);
  return `${year}-${String(Math.max(0, ...used) + 1).padStart(3, "0")}`;
}

export function emptyProposal(existing: Pick<ProposalFields, "number">[], prefill: Partial<ProposalFields> = {}): ProposalFields {
  const date = today();
  return {
    number: nextProposalNumber(existing, date), status: "draft", clientId: "", contactName: "", companyName: "", companyDocument: "",
    project: "", date, validityDays: "15", today: "", pains: ["", ""], solution: "", changes: [{ before: "", after: "" }],
    stages: [{ title: "", deliverable: "", days: "", value: "" }, { title: "No ar e acompanhado", deliverable: "Publicação, treinamento da equipe e acompanhamento dos primeiros dias.", days: "", value: "" }],
    followUpDays: "30", included: [...defaultIncluded], excluded: ["Custos de hospedagem e serviços de terceiros.", "Novas funções fora deste escopo."],
    payment: "Por etapa, na entrega", paymentMethod: "", start: "", notes: "", ...prefill,
  };
}

const amount = (value: string) => { const number = Number(value); return Number.isFinite(number) ? number : 0; };
export const proposalTotal = (stages: ProposalStage[]) => stages.reduce((sum, stage) => sum + amount(stage.value), 0);
export const proposalDays = (stages: ProposalStage[]) => stages.reduce((sum, stage) => sum + (Number(stage.days) || 0), 0);

/** Campos que nunca podem sair inventados: o PDF mostra o que falta como [campo a preencher]. */
export function missingFields(proposal: ProposalFields) {
  const missing: string[] = [];
  if (!proposal.companyName.trim()) missing.push("empresa");
  if (!proposal.project.trim()) missing.push("nome do projeto");
  if (!proposal.validityDays.trim()) missing.push("validade");
  if (!proposal.stages.length || proposal.stages.some(stage => !stage.title.trim() || !stage.days.trim() || !stage.value)) missing.push("prazo e valor de todas as etapas");
  if (!proposal.paymentMethod.trim()) missing.push("forma de pagamento");
  return missing;
}
