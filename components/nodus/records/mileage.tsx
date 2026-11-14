"use client";
import { RecordsPage, formatDate, type RecordsConfig } from "@/components/records/records-page";
import { formatBRL } from "@/lib/format/currency";
import { mileageCosts, mileageStore, type MileageFields } from "@/lib/nodus/stores";
import { today } from "@/lib/format/date";

const kmDriven = (entry: MileageFields) => { const initial = Number(entry.initialKm); const final = Number(entry.finalKm); return entry.initialKm && entry.finalKm && final >= initial ? final - initial : null; };
const costOf = (entry: MileageFields, name: (typeof mileageCosts)[number]["name"]) => Number(entry[name]) || 0;
const totalCost = (entry: MileageFields) => mileageCosts.reduce((sum, field) => sum + costOf(entry, field.name), 0);
/** KM final vazio: usa o KM inicial do próximo lançamento do mesmo carro. */
const withInferredKm = (entry: MileageFields) => {
  if (entry.finalKm) return entry;
  const next = mileageStore.current().filter(item => item.vehicleId === entry.vehicleId && item.date > entry.date).sort((a, b) => a.date.localeCompare(b.date))[0];
  return next?.initialKm ? { ...entry, finalKm: next.initialKm } : entry;
};
// O mesmo trecho lançado para vários clientes (mesmo carro, dia e KM) conta uma vez no total.
const totalKm = (entries: MileageFields[]) => {
  const trips = new Map<string, number>();
  entries.forEach((entry, index) => { const inferred = withInferredKm(entry); const km = kmDriven(inferred); if (km !== null) trips.set(entry.vehicleId ? `${entry.date}|${entry.vehicleId}|${entry.initialKm}|${inferred.finalKm}` : String(index), km); });
  return [...trips.values()].reduce((sum, km) => sum + km, 0);
};

function MileageSummary({ entries }: { entries: MileageFields[] }) {
  const km = totalKm(entries); const total = entries.reduce((sum, entry) => sum + totalCost(entry), 0);
  const tiles = [{ label: "KM rodados", value: `${km.toLocaleString("pt-BR")} km` }, { label: "Custo total", value: formatBRL(total.toFixed(2)) },
    ...mileageCosts.map(field => ({ label: field.label, value: formatBRL(entries.reduce((sum, entry) => sum + costOf(entry, field.name), 0).toFixed(2)) })),
    ...(km > 0 && total > 0 ? [{ label: "Custo por km", value: formatBRL((total / km).toFixed(2)) }] : [])];
  return <dl className="grid grid-cols-2 gap-px overflow-hidden border bg-border sm:grid-cols-4 xl:grid-cols-8">{tiles.map(tile => <div key={tile.label} className="bg-card px-3 py-2.5"><dt className="text-[11px] text-muted-foreground">{tile.label}</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{tile.value}</dd></div>)}</dl>;
}

export const mileageConfig: RecordsConfig<MileageFields> = {
  store: mileageStore, section: "Frota", title: "Lançamentos de KM", description: "Quilometragem diária por carro, com motorista, passageiros e custos.",
  singular: "lançamento", newLabel: "Novo lançamento", submitLabel: "Salvar lançamento", emptyText: "Registre o primeiro lançamento de KM.",
  empty: () => ({ date: today(), vehicleId: "", driverId: "", passengerIds: [], clientId: "", tripId: "", initialKm: "", finalKm: "", fuelCost: "", tollCost: "", foodCost: "", hotelCost: "", otherCost: "", notes: "" }),
  fields: [
    { name: "date", label: "Data", type: "date", required: true }, { name: "vehicleId", label: "Carro", type: "reference", source: "vehicles", required: true },
    { name: "driverId", label: "Motorista", type: "reference", source: "employees" }, { name: "clientId", label: "Cliente", type: "reference", source: "clients" },
    { name: "tripId", label: "Viagem", type: "reference", source: "trips" }, { name: "initialKm", label: "KM inicial", type: "number" },
    { name: "finalKm", label: "KM final", type: "number", hint: "Se ficar vazio, usa o KM inicial do próximo lançamento do mesmo carro." },
    { name: "passengerIds", label: "Passageiros", type: "reference", source: "employees", multiple: true },
    ...mileageCosts.map(field => ({ name: field.name, label: field.label, type: "currency" as const })),
    { name: "notes", label: "Observações", type: "textarea", rows: 3 },
  ],
  validate: values => values.initialKm && values.finalKm && Number(values.finalKm) < Number(values.initialKm) ? "O KM final não pode ser menor que o inicial." : "",
  card: (entry, lookup) => {
    const inferred = withInferredKm(entry);
    const km = kmDriven(inferred); const cost = totalCost(entry);
    return { title: lookup("vehicles", entry.vehicleId) || "Carro não informado", subtitle: formatDate(entry.date),
      badge: km !== null ? { label: `${km.toLocaleString("pt-BR")} km${inferred !== entry ? "*" : ""}` } : undefined,
      lines: [lookup("employees", entry.driverId) && `Motorista: ${lookup("employees", entry.driverId)}`, lookup("clients", entry.clientId) && `Cliente: ${lookup("clients", entry.clientId)}`,
        entry.passengerIds?.length > 0 && `${entry.passengerIds.length} passageiro(s)`, cost > 0 && `Custos ${formatBRL(cost.toFixed(2))}: ${mileageCosts.filter(field => costOf(entry, field.name) > 0).map(field => field.label.toLocaleLowerCase("pt-BR")).join(", ")}`, inferred !== entry && "* KM final inferido do próximo lançamento"] };
  },
  searchText: (entry, lookup) => [entry.code, entry.notes, lookup("vehicles", entry.vehicleId), lookup("employees", entry.driverId), lookup("clients", entry.clientId)],
  sort: (a, b) => b.date.localeCompare(a.date),
  filter: {
    label: "Carro",
    options: (entries, lookup) => [...new Set(entries.map(entry => entry.vehicleId).filter(Boolean))].map(id => ({ value: id, label: lookup("vehicles", id) || "Carro removido" })).sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    test: (entry, value) => entry.vehicleId === value,
  },
  summary: entries => <MileageSummary entries={entries} />,
};

export function MileagePage() { return <RecordsPage config={mileageConfig} />; }
