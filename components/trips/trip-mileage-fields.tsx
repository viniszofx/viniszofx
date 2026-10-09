"use client";
import { Input } from "@/components/ui/input";
import type { TripFields } from "@/lib/trips/store";
export function TripMileageFields({ value, onChange }: { value: TripFields; onChange: (patch: Partial<TripFields>) => void }) {
 return <section aria-label="Quilometragem" className="space-y-4 border-t pt-5"><h3 className="text-sm font-semibold">Quilometragem</h3><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm">KM inicial<Input aria-label="KM inicial" type="number" inputMode="decimal" min="0" step="0.1" value={value.initialKm ?? ""} onChange={event => onChange({ initialKm: event.target.value })} /></label><label className="grid gap-2 text-sm">KM final<Input aria-label="KM final" type="number" inputMode="decimal" min={value.initialKm || "0"} step="0.1" value={value.finalKm ?? ""} onChange={event => onChange({ finalKm: event.target.value })} /></label></div></section>;
}
