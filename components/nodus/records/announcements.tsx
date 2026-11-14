"use client";
import { RecordsPage, formatDate, type RecordsConfig } from "@/components/records/records-page";
import { announcementState, announcementStore, type AnnouncementFields } from "@/lib/nodus/stores";

export const announcementsConfig: RecordsConfig<AnnouncementFields> = {
  store: announcementStore, section: "Comunicação", title: "Mural", description: "Avisos com rascunho, publicação programada e prazo de exibição.",
  singular: "aviso", newLabel: "Novo aviso", submitLabel: "Salvar aviso", emptyText: "Publique o primeiro aviso.",
  empty: () => ({ title: "", body: "", status: "published", publishAt: "", expiresAt: "", cover: [] }),
  fields: [
    { name: "title", label: "Título", type: "text", required: true, wide: true },
    { name: "status", label: "Situação", type: "select", options: [{ value: "published", label: "Publicar" }, { value: "draft", label: "Rascunho" }] },
    { name: "publishAt", label: "Publicar em", type: "datetime-local", hint: "Vazio publica imediatamente." },
    { name: "expiresAt", label: "Retirar do mural em", type: "datetime-local" },
    { name: "body", label: "Mensagem", type: "textarea", rows: 6 },
    { name: "cover", label: "Capa", type: "attachments" },
  ],
  validate: values => values.publishAt && values.expiresAt && String(values.expiresAt) <= String(values.publishAt) ? "O prazo deve ser posterior à publicação." : "",
  card: item => { const state = announcementState(item); return { title: item.title, badge: { label: state.label, color: state.key === "active" ? "#16a34a" : undefined }, lines: [item.publishAt && `Publicação ${formatDate(item.publishAt)}`, item.expiresAt && `Até ${formatDate(item.expiresAt)}`], body: item.body ? <p className="line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">{item.body}</p> : undefined }; },
  searchText: item => [item.title, item.body],
  filter: { label: "Situação", options: [{ value: "active", label: "No mural" }, { value: "scheduled", label: "Programados" }, { value: "draft", label: "Rascunhos" }, { value: "expired", label: "Encerrados" }], test: (item, value) => announcementState(item).key === value },
};

export function AnnouncementsPage() { return <RecordsPage config={announcementsConfig} />; }
