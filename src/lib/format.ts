const LOCALE = "es-AR";

// Distance: up to 2 decimals, no trailing zeros (392.95 → "392,95", 310 → "310")
export const fmtDistance = (km: number): string =>
  km.toLocaleString(LOCALE, { maximumFractionDigits: 2 });

// Consumption: always 2 decimals (0.45 → "0,45", 0.40 → "0,40")
export const fmtConsumption = (lPerKm: number): string =>
  lPerKm.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Fuel cost: no decimals (1326206.25 → "1.326.206")
export const fmtCost = (gs: number): string =>
  gs.toLocaleString(LOCALE, { maximumFractionDigits: 0 });

// Fuel price per liter: no decimals (7500 → "7.500")
export const fmtPrice = (gs: number): string =>
  gs.toLocaleString(LOCALE, { maximumFractionDigits: 0 });
