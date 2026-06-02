import { haversineDistanceKm } from "./calculations";

export async function getRoadDistanceKm(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<number> {
  try {
    // OSRM uses lng,lat order (opposite of Leaflet)
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("OSRM unavailable");
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) throw new Error("No route found");
    return data.routes[0].distance / 1000; // meters → km
  } catch {
    return haversineDistanceKm(originLat, originLng, destLat, destLng);
  }
}
