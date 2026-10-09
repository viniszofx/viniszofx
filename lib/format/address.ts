export type AddressFieldsValue = { postalCode?: string; city?: string; state?: string; street?: string; number?: string; complement?: string; neighborhood?: string };
export function addressText(value: AddressFieldsValue) { return [value.street, value.number, value.complement, value.neighborhood, value.city, value.state, value.postalCode].filter(Boolean).join(" · "); }
