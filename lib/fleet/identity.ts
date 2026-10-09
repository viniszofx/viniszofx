export function vehicleIdentification(vehicle: { type: string; brand: string; model: string; color?: string; year?: string }) {
 return [vehicle.type, vehicle.brand, vehicle.model, vehicle.color, vehicle.year].map(value => value?.trim()).filter(Boolean).join(" · ");
}
export const vehicleColors = ["Branco", "Preto", "Prata", "Cinza", "Vermelho", "Azul", "Verde", "Amarelo", "Bege", "Marrom"];
