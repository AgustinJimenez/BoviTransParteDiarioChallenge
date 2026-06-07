import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { RequestStatus } from "@/types";

const VALID_STATUSES: RequestStatus[] = ["PENDING", "ASSIGNED", "COMPLETED", "CANCELLED"];

const CreateRequestSchema = z.object({
  requesterName: z.string().min(1, "El nombre es requerido"),
  requesterPhone: z.string().optional(),
  cattleCount: z.number().int().min(1, "La cantidad de ganado debe ser mayor a 0"),
  origin: z.string().min(1, "El origen es requerido"),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destination: z.string().min(1, "El destino es requerido"),
  destinationLat: z.number().optional(),
  destinationLng: z.number().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serialize = (r: any) => ({
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
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const rawStatus = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.trim() || null;
    const page  = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "24")));
    const skip  = (page - 1) * limit;

    const statusFilter = rawStatus && VALID_STATUSES.includes(rawStatus as RequestStatus)
      ? { status: rawStatus as RequestStatus }
      : {};

    const searchFilter = search ? {
      OR: [
        { requesterName:  { contains: search, mode: "insensitive" as const } },
        { requesterPhone: { contains: search, mode: "insensitive" as const } },
        { origin:         { contains: search, mode: "insensitive" as const } },
        { destination:    { contains: search, mode: "insensitive" as const } },
      ],
    } : {};

    const where = { ...statusFilter, ...searchFilter };

    const [total, requests] = await Promise.all([
      prisma.transportRequest.count({ where }),
      prisma.transportRequest.findMany({
        where,
        include:  { assignedTruck: true },
        orderBy:  { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: { items: requests.map(serialize), hasMore: skip + requests.length < total, total },
      error: null,
    });
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
