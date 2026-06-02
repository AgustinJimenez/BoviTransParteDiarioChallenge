export interface Coords {
  lat: number;
  lng: number;
}

export async function geocodeLocation(location: string): Promise<Coords | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=ar`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BoviTrans-MVP/1.0" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
