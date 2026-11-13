"use client";

import type { CardAttachment } from "@/lib/boards/store";
import { createRecordStore, type StoredRecord } from "@/lib/records/store";
import type { FileReference } from "@/lib/storage/collections";
import type { FolderColor } from "@/lib/drive/files";
import { currentCompany } from "./company";
import type { TodoListFields } from "./todo-lists";

export const services = [
  { value: "cabling", label: "Passagem de cabos", color: "#64748b" },
  { value: "installation", label: "Instalação", color: "#1e3a8a" },
  { value: "inspection", label: "Vistoria", color: "#f97316" },
  { value: "maintenance", label: "Manutenção", color: "#ec4899" },
  { value: "office", label: "Escritório", color: "#16a34a" },
  { value: "absence", label: "Falta/Banco de horas", color: "#dc2626" },
  { value: "trip", label: "Viagem", color: "#7c3aed" },
  { value: "training", label: "Treinamento", color: "#06b6d4" },
  { value: "medical", label: "Médico", color: "#eab308" },
] as const;
/** Cor do serviço, com a personalização salva nos ajustes da empresa. */
export const serviceColor = (value?: string) => (value && currentCompany().serviceColors?.[value]) || services.find(service => service.value === value)?.color || "#7c3aed";
export const serviceLabel = (value?: string) => services.find(service => service.value === value)?.label ?? "";

export type MaterialRow = { id: string; quantity: string; name: string; description: string; notes: string };
export type OrderFields = {
  title: string; status: "open" | "scheduled" | "in_progress" | "done" | "canceled"; clientId: string; service: string;
  employeeIds: string[]; tripId: string; releaseEmployeeId: string; startDate: string; endDate: string;
  execution: string; materials: MaterialRow[]; attachments: CardAttachment[]; notes: string;
};
export const orderStatuses = [
  { value: "open", label: "Aberta" }, { value: "scheduled", label: "Agendada" }, { value: "in_progress", label: "Em execução" },
  { value: "done", label: "Concluída" }, { value: "canceled", label: "Cancelada" },
] as const;
export const orderStore = createRecordStore<OrderFields>("orders", { created: "Ordem criada", updated: "Ordem atualizada", deleted: "Ordem excluída", plural: "as ordens" });

export type TaskFields = { title: string; description: string; startDate: string; dueDate: string; done: boolean; employeeId: string; clientId: string };
export const taskStore = createRecordStore<TaskFields>("tasks", { created: "Tarefa criada", updated: "Tarefa atualizada", deleted: "Tarefa excluída", plural: "as tarefas" });

export type EventFields = { title: string; service: string; start: string; end: string; location: string; description: string; employeeIds: string[] };
export const eventStore = createRecordStore<EventFields>("events", { created: "Evento criado", updated: "Evento atualizado", deleted: "Evento excluído", plural: "os eventos" });

export type AnnouncementFields = { title: string; body: string; status: "draft" | "published"; publishAt: string; expiresAt: string; cover: CardAttachment[] };
export const announcementStore = createRecordStore<AnnouncementFields>("announcements", { created: "Aviso criado", updated: "Aviso atualizado", deleted: "Aviso excluído", plural: "os avisos" });
export function announcementState(item: AnnouncementFields, now = new Date()) {
  if (item.status === "draft") return { key: "draft", label: "Rascunho" } as const;
  if (item.publishAt && new Date(item.publishAt) > now) return { key: "scheduled", label: "Programado" } as const;
  if (item.expiresAt && new Date(item.expiresAt) <= now) return { key: "expired", label: "Encerrado" } as const;
  return { key: "active", label: "No mural" } as const;
}

export type HotelFields = { name: string; phone: string; email: string; address: string; city: string; dailyRate: string; notes: string };
export const hotelStore = createRecordStore<HotelFields>("hotels", { created: "Hotel cadastrado", updated: "Hotel atualizado", deleted: "Hotel excluído", plural: "os hotéis" });

export type MileageFields = {
  date: string; vehicleId: string; driverId: string; passengerIds: string[]; clientId: string; tripId: string;
  initialKm: string; finalKm: string; fuelCost: string; tollCost: string; otherCost: string; notes: string;
};
export const mileageStore = createRecordStore<MileageFields>("mileage", { created: "Lançamento registrado", updated: "Lançamento atualizado", deleted: "Lançamento excluído", plural: "os lançamentos de KM" });

export type JourneyEventType = "start" | "arrival" | "departure" | "photo" | "end";
export type JourneyEvent = {
  id: string; type: JourneyEventType; at: string; latitude?: number; longitude?: number; accuracy?: number;
  place: string; km: string; photoKind?: "receipt" | "service" | "incident" | "odometer"; photo?: CardAttachment; notes: string;
};
export type JourneyFields = { date: string; employeeId: string; tripId: string; vehicleId: string; vehicleText: string; destination: string; events: JourneyEvent[] };
export const journeyStore = createRecordStore<JourneyFields>("journeys", { created: "Jornada iniciada", updated: "Jornada atualizada", deleted: "Jornada excluída", plural: "as jornadas" });

export type InventoryFields = { name: string; notes: string };
export const inventoryStore = createRecordStore<InventoryFields>("inventories", { created: "Inventário criado", updated: "Inventário atualizado", deleted: "Inventário excluído", plural: "os inventários" });
export type Inventory = StoredRecord<InventoryFields>;
export type InventoryItemFields = { inventoryId?: string; name: string; sku: string; category: string; unit: string; minimum: string; purchaseValue: string; saleValue: string; notes: string };
export const inventoryItemStore = createRecordStore<InventoryItemFields>("inventory_items", { created: "Item cadastrado", updated: "Item atualizado", deleted: "Item excluído", plural: "os itens" });
export type InventoryLocationFields = { name: string; notes: string };
export const inventoryLocationStore = createRecordStore<InventoryLocationFields>("inventory_locations", { created: "Local cadastrado", updated: "Local atualizado", deleted: "Local excluído", plural: "os locais" });
export type MovementFields = { type: "in" | "out" | "transfer"; itemId: string; quantity: string; fromLocationId: string; toLocationId: string; date: string; reason: string };
export const movementStore = createRecordStore<MovementFields>("inventory_movements", { created: "Movimentação registrada", updated: "Movimentação atualizada", deleted: "Movimentação excluída", plural: "as movimentações" });

/** Balance per item and location, derived from the movement history. */
export function stockBalances(movements: MovementFields[]) {
  const balances = new Map<string, number>();
  const add = (itemId: string, locationId: string, amount: number) => {
    const key = `${itemId}:${locationId}`;
    balances.set(key, (balances.get(key) ?? 0) + amount);
  };
  for (const movement of movements) {
    const quantity = Number(movement.quantity) || 0;
    if (movement.type === "in") add(movement.itemId, movement.toLocationId, quantity);
    if (movement.type === "out") add(movement.itemId, movement.fromLocationId, -quantity);
    if (movement.type === "transfer") { add(movement.itemId, movement.fromLocationId, -quantity); add(movement.itemId, movement.toLocationId, quantity); }
  }
  return balances;
}

export type RequestTodo = { id: string; text: string; done: boolean };
export const requestTypes = [
  { value: "materials", label: "Materiais" }, { value: "equipment", label: "Equipamento" }, { value: "document", label: "Documento" },
  { value: "release", label: "Liberação" }, { value: "update", label: "Atualização" },
] as const;
export type RequestFields = { title: string; type: string; status: "open" | "done"; description: string; todos: RequestTodo[]; orderId: string; attachments: CardAttachment[] };
export const requestStore = createRecordStore<RequestFields>("requests", { created: "Solicitação criada", updated: "Solicitação atualizada", deleted: "Solicitação excluída", plural: "as solicitações" });

// `blob` keeps the stored-file reference: the Drive store loads lazily and a
// file is only downloaded when opened (see lib/drive/client.ts).
export type DriveFile = { id: string; name: string; type: string; size: number; blob: FileReference };
export type DriveFields = { kind: "folder" | "file"; name: string; parentId: string; color?: FolderColor; file?: DriveFile; shareToken?: string; openedAt?: string; visibility?: "private" | "organization" | "public"; sharedWith?: string[] };
export const driveStore = createRecordStore<DriveFields>("drive", { created: "Item criado", updated: "Item atualizado", deleted: "Item excluído", plural: "os arquivos do Drive" }, { lazyFiles: true });

export type DiagramFields = { title: string; xml: string; thumbnail: string; shareToken?: string };
export type DrawioLibraryFields = { title: string; content: string };
export const drawioLibraryStore = createRecordStore<DrawioLibraryFields>("drawio_libraries", { created: "Biblioteca adicionada", updated: "Biblioteca atualizada", deleted: "Biblioteca excluída", plural: "as bibliotecas" });
export type DrawioLibrary = StoredRecord<DrawioLibraryFields>;
export const diagramStore = createRecordStore<DiagramFields>("diagrams", { created: "Diagrama criado", updated: "Diagrama salvo", deleted: "Diagrama excluído", plural: "os diagramas" });

export type TodoFields = { title: string; notes: string; startDate: string; endDate: string; listId: string; done: boolean };
export const todoStore = createRecordStore<TodoFields>("todos", { created: "Tarefa criada", updated: "Tarefa atualizada", deleted: "Tarefa excluída", plural: "as tarefas pessoais" });
export const todoListStore = createRecordStore<TodoListFields>("todo_lists", { created: "Lista criada", updated: "Lista atualizada", deleted: "Lista excluída", plural: "as listas" });
// O desenho fica num arquivo JSON no storage (pode ter imagens); o registro guarda a referência e a miniatura.
export type WhiteboardFields = { title: string; content: FileReference | null; thumbnail: string };
export const whiteboardStore = createRecordStore<WhiteboardFields>("whiteboards", { created: "Quadro criado", updated: "Quadro salvo", deleted: "Quadro excluído", plural: "os quadros" }, { lazyFiles: true });
export type Whiteboard = StoredRecord<WhiteboardFields>;
export type Todo = StoredRecord<TodoFields>;
export type TodoList = StoredRecord<TodoListFields>;

export type Order = StoredRecord<OrderFields>;
export type Task = StoredRecord<TaskFields>;
export type CalendarEvent = StoredRecord<EventFields>;
export type Journey = StoredRecord<JourneyFields>;
export type DriveItem = StoredRecord<DriveFields>;
export type Diagram = StoredRecord<DiagramFields>;
