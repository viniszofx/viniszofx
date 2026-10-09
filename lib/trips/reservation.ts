export function reservationTotal(departure?: string, returning?: string, dailyRate?: string) {
 if (!departure || !returning || !dailyRate || !/^\d{4}-\d{2}-\d{2}$/.test(departure) || !/^\d{4}-\d{2}-\d{2}$/.test(returning)) return null;
 const start = Date.parse(`${departure}T00:00:00Z`); const end = Date.parse(`${returning}T00:00:00Z`); const rate = Number(dailyRate);
 if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || !Number.isFinite(rate) || rate < 0) return null;
 const nights = Math.round((end - start) / 86400000);
 return { nights, total: (Math.round(rate * 100) * nights / 100).toFixed(2) };
}
