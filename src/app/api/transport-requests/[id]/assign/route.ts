import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocoding";
import { getRoadDistanceKm } from "@/lib/routing";
import { calculateFuelCost, isCapacityExceeded, calculateTripsNeeded } from "@/lib/calculations";

const AssignSchema = z.object({ truckId: z.string().min(1) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = AssignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: "ID de camión inválido" }, { status: 400 });
    }

    const [request, truck, fuelConfig] = await Promise.all([
      prisma.transportRequest.findUnique({ where: { id } }),
      prisma.truck.findUnique({ where: { id: parsed.data.truckId } }),
      prisma.systemConfig.findUnique({ where: { key: "fuel_price_per_liter" } }),
    ]);

    if (!request) return NextResponse.json({ data: null, error: "Solicitud no encontrada" }, { status: 404 });
    if (!truck) return NextResponse.json({ data: null, error: "Camión no encontrado" }, { status: 404 });
    if (!truck.isActive) return NextResponse.json({ data: null, error: "El camión está inactivo" }, { status: 422 });
    if (request.status === "COMPLETED") {
      return NextResponse.json({ data: null, error: "No se puede modificar una solicitud completada" }, { status: 422 });
    }

    let oLat = request.originLat ? Number(request.originLat) : null;
    let oLng = request.originLng ? Number(request.originLng) : null;
    let dLat = request.destinationLat ? Number(request.destinationLat) : null;
    let dLng = request.destinationLng ? Number(request.destinationLng) : null;
    let distanceKm = request.distanceKm ? Number(request.distanceKm) : null;

    if (!oLat || !oLng) {
      const c = await geocodeLocation(request.origin);
      if (c) { oLat = c.lat; oLng = c.lng; }
    }
    if (!dLat || !dLng) {
      const c = await geocodeLocation(request.destination);
      if (c) { dLat = c.lat; dLng = c.lng; }
    }
    if (!distanceKm && oLat && oLng && dLat && dLng) {
      distanceKm = await getRoadDistanceKm(oLat, oLng, dLat, dLng);
    }

    const fuelPrice = fuelConfig ? parseFloat(fuelConfig.value) : 1250;
    const fuelCost = distanceKm ? calculateFuelCost(distanceKm, Number(truck.fuelConsumption), fuelPrice) : null;

    const updated = await prisma.transportRequest.update({
      where: { id },
      data: {
        assignedTruckId: parsed.data.truckId,
        status: "ASSIGNED",
        ...(distanceKm != null && { distanceKm }),
        ...(fuelCost != null && { fuelCost }),
        ...(oLat != null && { originLat: oLat }),
        ...(oLng != null && { originLng: oLng }),
        ...(dLat != null && { destinationLat: dLat }),
        ...(dLng != null && { destinationLng: dLng }),
      },
      include: { assignedTruck: true },
    });

    const exceeded = isCapacityExceeded(request.cattleCount, truck.maxCapacity);

    return NextResponse.json({
      data: {
        ...updated,
        distanceKm: updated.distanceKm ? Number(updated.distanceKm) : null,
        fuelCost: updated.fuelCost ? Number(updated.fuelCost) : null,
        originLat: updated.originLat ? Number(updated.originLat) : null,
        originLng: updated.originLng ? Number(updated.originLng) : null,
        destinationLat: updated.destinationLat ? Number(updated.destinationLat) : null,
        destinationLng: updated.destinationLng ? Number(updated.destinationLng) : null,
        assignedTruck: updated.assignedTruck
          ? { ...updated.assignedTruck, fuelConsumption: Number(updated.assignedTruck.fuelConsumption) }
          : null,
      },
      error: null,
      capacityWarning: exceeded
        ? { exceeded: true, tripsNeeded: calculateTripsNeeded(request.cattleCount, truck.maxCapacity) }
        : null,
    });
  } catch {
    return NextResponse.json({ data: null, error: "Error al asignar camión" }, { status: 500 });
  }
}
