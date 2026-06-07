import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocoding";
import { getRoadDistanceKm } from "@/lib/routing";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(r: any) {
  return {
    ...r,
    distanceKm: r.distanceKm != null ? Number(r.distanceKm) : null,
    fuelCost: r.fuelCost != null ? Number(r.fuelCost) : null,
    originLat: r.originLat != null ? Number(r.originLat) : null,
    originLng: r.originLng != null ? Number(r.originLng) : null,
    destinationLat: r.destinationLat != null ? Number(r.destinationLat) : null,
    destinationLng: r.destinationLng != null ? Number(r.destinationLng) : null,
    assignedTruck: r.assignedTruck
      ? { ...r.assignedTruck, fuelConsumption: Number(r.assignedTruck.fuelConsumption) }
      : null,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let request = await prisma.transportRequest.findUnique({
      where: { id },
      include: { assignedTruck: true },
    });
    if (!request) {
      return NextResponse.json({ data: null, error: "Solicitud no encontrada" }, { status: 404 });
    }

    // Enrich with geocoding + distance if missing (cache results in DB)
    const updates: Record<string, unknown> = {};

    let oLat = request.originLat ? Number(request.originLat) : null;
    let oLng = request.originLng ? Number(request.originLng) : null;
    let dLat = request.destinationLat ? Number(request.destinationLat) : null;
    let dLng = request.destinationLng ? Number(request.destinationLng) : null;

    if (!oLat || !oLng) {
      const coords = await geocodeLocation(request.origin);
      if (coords) {
        oLat = coords.lat; oLng = coords.lng;
        updates.originLat = coords.lat; updates.originLng = coords.lng;
      }
    }
    if (!dLat || !dLng) {
      const coords = await geocodeLocation(request.destination);
      if (coords) {
        dLat = coords.lat; dLng = coords.lng;
        updates.destinationLat = coords.lat; updates.destinationLng = coords.lng;
      }
    }
    if (!request.distanceKm && oLat && oLng && dLat && dLng) {
      const km = await getRoadDistanceKm(oLat, oLng, dLat, dLng);
      updates.distanceKm = km;
    }

    if (Object.keys(updates).length > 0) {
      request = await prisma.transportRequest.update({
        where: { id },
        data: updates,
        include: { assignedTruck: true },
      });
    }

    return NextResponse.json({ data: serialize(request), error: null });
  } catch {
    return NextResponse.json({ data: null, error: "Error al obtener la solicitud" }, { status: 500 });
  }
}
