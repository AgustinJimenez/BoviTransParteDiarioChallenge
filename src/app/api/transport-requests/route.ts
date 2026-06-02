import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreateRequestSchema = z.object({
  requesterName: z.string().min(1, "El nombre es requerido"),
  requesterPhone: z.string().optional(),
  cattleCount: z.number().int().min(1, "La cantidad de ganado debe ser mayor a 0"),
  origin: z.string().min(1, "El origen es requerido"),
  destination: z.string().min(1, "El destino es requerido"),
});

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

export async function GET(req: NextRequest) {
  try {
    const status = new URL(req.url).searchParams.get("status") as string | null;
    const requests = await prisma.transportRequest.findMany({
      where: status ? { status: status as "PENDING" | "ASSIGNED" | "COMPLETED" | "CANCELLED" } : undefined,
      include: { assignedTruck: true },
      orderBy: [{ createdAt: "desc" }],
    });
    return NextResponse.json({ data: requests.map(serialize), error: null });
  } catch {
    return NextResponse.json({ data: null, error: "Error al obtener solicitudes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const request = await prisma.transportRequest.create({
      data: { ...parsed.data, status: "PENDING" },
      include: { assignedTruck: true },
    });
    return NextResponse.json({ data: serialize(request), error: null }, { status: 201 });
  } catch {
    return NextResponse.json({ data: null, error: "Error al crear la solicitud" }, { status: 500 });
  }
}
