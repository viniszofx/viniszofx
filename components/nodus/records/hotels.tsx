"use client";
import { RecordsPage, type RecordsConfig } from "@/components/records/records-page";
import { formatBRL } from "@/lib/format/currency";
import { hotelStore, type HotelFields } from "@/lib/nodus/stores";

export const hotelsConfig: RecordsConfig<HotelFields> = {
  store: hotelStore, section: "Cadastros", title: "Hotéis", description: "Hotéis usados nas hospedagens das viagens.",
  singular: "hotel", newLabel: "Novo hotel", submitLabel: "Salvar hotel", emptyText: "Cadastre o primeiro hotel.",
  empty: () => ({ name: "", phone: "", email: "", address: "", city: "", dailyRate: "", notes: "" }),
  fields: [
    { name: "name", label: "Nome", type: "text", required: true, wide: true },
    { name: "phone", label: "Telefone", type: "tel" }, { name: "email", label: "E-mail", type: "email" },
    { name: "city", label: "Cidade", type: "text" }, { name: "dailyRate", label: "Diária", type: "currency" },
    { name: "address", label: "Endereço", type: "text", wide: true }, { name: "notes", label: "Observações", type: "textarea", rows: 3 },
  ],
  card: hotel => ({ title: hotel.name, subtitle: hotel.city, lines: [hotel.phone, hotel.email, hotel.dailyRate && `Diária ${formatBRL(hotel.dailyRate)}`] }),
  searchText: hotel => [hotel.code, hotel.name, hotel.city, hotel.address, hotel.phone, hotel.email, hotel.notes],
  sort: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
};

export function HotelsPage() { return <RecordsPage config={hotelsConfig} />; }
