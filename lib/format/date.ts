// Datas no fuso de quem usa o app: "AAAA-MM-DD" local, nunca a data UTC de toISOString(),
// que à noite no Brasil já vira o dia seguinte.
export function localDate(date: Date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Hoje, como "AAAA-MM-DD" no fuso local. */
export const today = () => localDate();
