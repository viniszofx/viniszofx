"use client";
import { Input } from "@/components/ui/input";
import type { TripFields } from "@/lib/trips/store";
export function TripDateFields({ value, onChange }: { value: TripFields; onChange: (patch: Partial<TripFields>) => void }) {
 return <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm">Data de ida<Input aria-label="Data de ida" type="date" value={value.departureDate ?? ""} onChange={event => onChange({ departureDate: event.target.value })} /></label><label className="grid gap-2 text-sm">Data de retorno<Input aria-label="Data de retorno" type="date" min={value.departureDate || undefined} value={value.returnDate ?? ""} onChange={event => onChange({ returnDate: event.target.value })} /></label></div>;
}
