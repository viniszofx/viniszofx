"use client";
import { Field, Select } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useEmployees } from "@/lib/employees/store";
import { ownershipOptions, rentalKmAlert, rentalKmDriven, type VehicleOwnership } from "@/lib/fleet/ownership";

export function VehicleOwnershipFields({ value, onChange }: { value: VehicleOwnership; onChange: (patch: Partial<VehicleOwnership>) => void }) {
  const { employees } = useEmployees();
  const ownership = value.ownership ?? "company";
  const driven = rentalKmDriven(value);
  return <section className="space-y-4 border-t pt-5"><h3 className="text-sm font-semibold">Situação e propriedade</h3>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Situação" hint="Inativo (vendido, devolvido, parado) some da escolha de veículo nas viagens."><Select value={value.status ?? "active"} options={[{ value: "active", label: "Ativo" }, { value: "inactive", label: "Inativo" }]} onChange={event => onChange({ status: event.target.value as "active" | "inactive" })} /></Field>
      <Field label="Propriedade"><Select value={ownership} options={ownershipOptions} onChange={event => onChange({ ownership: event.target.value as VehicleOwnership["ownership"] })} /></Field>
      {ownership === "employee" && <>
        <Field label="Colaborador dono"><Select value={value.ownerEmployeeId ?? ""} placeholder="Fora do cadastro" options={employees.map(employee => ({ value: employee.id, label: employee.name }))} onChange={event => onChange({ ownerEmployeeId: event.target.value })} /></Field>
        {!value.ownerEmployeeId && <Field label="Nome do dono"><Input maxLength={200} value={value.ownerName ?? ""} onChange={event => onChange({ ownerName: event.target.value })} /></Field>}
      </>}
      {ownership === "rented" && <>
        <Field label="Locadora" required><Input maxLength={200} value={value.rentalCompany ?? ""} onChange={event => onChange({ rentalCompany: event.target.value })} /></Field>
        <Field label="Limite mensal de KM"><Input type="number" min={0} value={value.rentalMonthlyKmLimit ?? ""} onChange={event => onChange({ rentalMonthlyKmLimit: event.target.value })} /></Field>
        <Field label="Retirada"><Input type="date" value={value.rentalStartDate ?? ""} onChange={event => onChange({ rentalStartDate: event.target.value })} /></Field>
        <Field label="Devolução"><Input type="date" min={value.rentalStartDate || undefined} value={value.rentalEndDate ?? ""} onChange={event => onChange({ rentalEndDate: event.target.value })} /></Field>
        <Field label="KM na retirada"><Input type="number" min={0} value={value.rentalInitialKm ?? ""} onChange={event => onChange({ rentalInitialKm: event.target.value })} /></Field>
        <Field label="KM atual" hint={driven ? `${driven.toLocaleString("pt-BR")} km rodados desde a retirada.` : undefined}><Input type="number" min={0} value={value.currentKm ?? ""} onChange={event => onChange({ currentKm: event.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={!!value.rentalAlertEnabled} onChange={event => onChange({ rentalAlertEnabled: event.target.checked })} />Avisar quando a quilometragem do aluguel chegar a um limite</label>
        {value.rentalAlertEnabled && <Field label="Alertar ao atingir (km rodados)"><Input type="number" min={1} value={value.rentalAlertKm ?? ""} onChange={event => onChange({ rentalAlertKm: event.target.value })} /></Field>}
        {rentalKmAlert(value) && <p role="alert" className="text-sm text-destructive sm:col-span-2">O veículo já rodou {driven.toLocaleString("pt-BR")} km desde a retirada, acima do alerta de {Number(value.rentalAlertKm).toLocaleString("pt-BR")} km.</p>}
      </>}
    </div>
  </section>;
}
