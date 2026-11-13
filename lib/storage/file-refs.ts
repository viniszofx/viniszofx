export const fileLimit = 20 * 1024 * 1024;
export const fileIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const collectionKinds = ["clients", "employees", "vehicles", "reservations", "trips", "boards", "notes", "attachments", "orders", "tasks", "events", "announcements", "hotels", "mileage", "journeys", "inventory_items", "inventory_locations", "inventory_movements", "requests", "drive", "diagrams", "settings", "todos", "todo_lists", "whiteboards", "drawio_libraries", "inventories"] as const;
export type CollectionKind = (typeof collectionKinds)[number];

export function fileIds(value: unknown, ids = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return ids;
  if (Array.isArray(value)) {
    for (const item of value) fileIds(item, ids);
  } else {
    const record = value as Record<string, unknown>;
    if (typeof record.__viniszofxFile === "string" && fileIdPattern.test(record.__viniszofxFile)) ids.add(record.__viniszofxFile);
    for (const item of Object.values(record)) fileIds(item, ids);
  }
  return ids;
}
