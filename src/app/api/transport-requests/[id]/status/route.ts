import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const StatusSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"]),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING:  ["CANCELLED"],
  ASSIGNED: ["COMPLETED", "CANCELLED"],
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: "Estado inválido" }, { status: 400 });
    }

    const request = await prisma.transportRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ data: null, error: "Solicitud no encontrada" }, { status: 404 });
    }

    const allowed = ALLOWED_TRANSITIONS[request.status] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json(
        { data: null, error: `No se puede pasar de ${request.status} a ${parsed.data.status}` },
        { status: 422 }
      );
    }

    const updated = await prisma.transportRequest.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ data: { status: updated.status }, error: null });
  } catch {
    return NextResponse.json({ data: null, error: "Error al actualizar el estado" }, { status: 500 });
  }
}
