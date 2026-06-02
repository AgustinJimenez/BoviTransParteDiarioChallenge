import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const truck = await prisma.truck.findUnique({ where: { id } });
    if (!truck) {
      return NextResponse.json({ data: null, error: "Camión no encontrado" }, { status: 404 });
    }

    let warning: string | null = null;
    if (truck.isActive) {
      const activeCount = await prisma.transportRequest.count({
        where: { assignedTruckId: id, status: { in: ["PENDING", "ASSIGNED"] } },
      });
      if (activeCount > 0) {
        warning = `Este camión tiene ${activeCount} solicitud(es) activa(s) asignada(s)`;
      }
    }

    const updated = await prisma.truck.update({
      where: { id },
      data: { isActive: !truck.isActive },
    });

    return NextResponse.json({
      data: { ...updated, fuelConsumption: Number(updated.fuelConsumption) },
      error: null,
      warning,
    });
  } catch {
    return NextResponse.json({ data: null, error: "Error al actualizar el camión" }, { status: 500 });
  }
}
