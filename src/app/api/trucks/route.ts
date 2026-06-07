import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CreateTruckSchema = z.object({
  plate: z.string().min(1, "La patente es requerida").max(20).toUpperCase(),
  maxCapacity: z.number().int().min(1, "La capacidad debe ser mayor a 0"),
  fuelConsumption: z.number().min(0.01, "El consumo debe ser mayor a 0").max(10),
});

function serializeTruck(t: Record<string, unknown>) {
  return { ...t, fuelConsumption: Number(t.fuelConsumption) };
}

export async function GET(req: NextRequest) {
  try {
    const onlyActive = new URL(req.url).searchParams.get("active") === "true";
    const trucks = await prisma.truck.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: trucks.map(serializeTruck), error: null });
  } catch {
    return NextResponse.json({ data: null, error: "Error al obtener camiones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateTruckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const truck = await prisma.truck.create({ data: parsed.data });
    return NextResponse.json({ data: serializeTruck(truck as Record<string, unknown>), error: null }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ data: null, error: "Ya existe un camión con esa patente" }, { status: 409 });
    }
    return NextResponse.json({ data: null, error: "Error al registrar el camión" }, { status: 500 });
  }
}
