"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { vehicleColors } from "@/lib/fleet/identity";
import { useVehicles } from "@/lib/fleet/store";
export function VehicleColorField({ value, onChange }: { value: string; onChange: (color: string) => void }) {
 const { vehicles } = useVehicles(); const [adding, setAdding] = useState(false);
 const colors = Array.from(new Set([...vehicleColors, ...vehicles.map(vehicle => vehicle.color?.trim() ?? ""), value.trim()].filter(Boolean))).sort((a,b) => a.localeCompare(b,"pt-BR"));
 return <div className="space-y-3"><label className="grid gap-2 text-sm">Cor<select aria-label="Cor do veículo" value={adding ? "__new__" : value} onChange={event => { const next = event.target.value;setAdding(next === "__new__");if(next !== "__new__") onChange(next); }} className="h-10 w-full min-w-0 border-b border-input bg-background text-sm outline-none focus-visible:border-ring"><option value="">Selecione a cor</option>{colors.map(color => <option key={color}>{color}</option>)}<option value="__new__">Nova cor</option></select></label>{adding && <label className="grid gap-2 text-sm">Nova cor<Input aria-label="Nova cor" autoFocus required maxLength={60} placeholder="Nome da cor" value={value} onChange={event => onChange(event.target.value)} /><span className="text-xs text-muted-foreground">Disponível nas próximas seleções após salvar o veículo.</span></label>}</div>;
}
