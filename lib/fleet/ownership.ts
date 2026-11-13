// Propriedade e aluguel do veículo, como no cadastro de frota do Nodus.
export type VehicleOwnership = {
  status?: "active" | "inactive";
  ownership?: "company" | "employee" | "rented";
  ownerEmployeeId?: string; ownerName?: string;
  rentalCompany?: string; rentalStartDate?: string; rentalEndDate?: string;
  rentalInitialKm?: string; currentKm?: string; rentalMonthlyKmLimit?: string;
  rentalAlertEnabled?: boolean; rentalAlertKm?: string;
};
export const ownershipOptions = [
  { value: "company", label: "Interno (da empresa)" },
  { value: "employee", label: "Próprio do colaborador" },
  { value: "rented", label: "Alugado" },
] as const;

/** KM rodados desde a retirada do veículo alugado. */
export function rentalKmDriven(value: VehicleOwnership) {
  if (!value.currentKm || !value.rentalInitialKm) return 0;
  return Math.max(0, Number(value.currentKm) - Number(value.rentalInitialKm));
}
export function rentalKmAlert(value: VehicleOwnership) {
  return value.ownership === "rented" && !!value.rentalAlertEnabled && !!Number(value.rentalAlertKm) && rentalKmDriven(value) >= Number(value.rentalAlertKm);
}
export function validateOwnership(value: VehicleOwnership) {
  if (value.ownership === "employee" && !value.ownerEmployeeId && !value.ownerName?.trim()) return "Escolha ou informe o colaborador dono do veículo.";
  if (value.ownership === "rented" && !value.rentalCompany?.trim()) return "Informe a locadora do veículo.";
  if (value.rentalStartDate && value.rentalEndDate && value.rentalEndDate < value.rentalStartDate) return "A devolução não pode anteceder a retirada.";
  if (value.currentKm && value.rentalInitialKm && Number(value.currentKm) < Number(value.rentalInitialKm)) return "O KM atual não pode ser menor que o KM na retirada.";
  if (value.rentalAlertEnabled && !Number(value.rentalAlertKm)) return "Informe a quilometragem do alerta.";
  return "";
}
