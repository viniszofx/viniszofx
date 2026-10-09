const realFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function formatBRL(value?: string) {
 if (!value) return "";
 const amount = Number(value);
 return Number.isFinite(amount) && amount >= 0 ? realFormatter.format(amount) : "";
}
export function parseBRLInput(value: string) {
 const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 14);
 return digits ? (Number(digits) / 100).toFixed(2) : "";
}
