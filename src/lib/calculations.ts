export function calculateFuelCost(
  distanceKm: number,
  fuelConsumptionLPer100Km: number,
  fuelPricePerLiter: number
): number {
  return distanceKm * fuelConsumptionLPer100Km * fuelPricePerLiter;
}

export function calculateTripsNeeded(
  cattleCount: number,
  truckCapacity: number
): number {
  return Math.ceil(cattleCount / truckCapacity);
}

export function isCapacityExceeded(
  cattleCount: number,
  truckCapacity: number
): boolean {
  return cattleCount > truckCapacity;
}

// Haversine formula — fallback when OSRM is unavailable
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
