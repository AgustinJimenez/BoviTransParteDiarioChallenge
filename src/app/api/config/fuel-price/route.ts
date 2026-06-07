import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CONFIG_KEY = "fuel_price_per_liter";

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } });
    return NextResponse.json({
      data: { price: config ? parseFloat(config.value) : 1250, updatedAt: config?.updatedAt ?? null },
      error: null,
    });
  } catch {
    return NextResponse.json({ data: null, error: "Error al obtener precio" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = z.object({ price: z.number().min(0.01, "El precio debe ser mayor a 0") }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const config = await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      update: { value: String(parsed.data.price) },
      create: { key: CONFIG_KEY, value: String(parsed.data.price) },
    });
    return NextResponse.json({
      data: { price: parseFloat(config.value), updatedAt: config.updatedAt },
      error: null,
    });
  } catch {
    return NextResponse.json({ data: null, error: "Error al actualizar precio" }, { status: 500 });
  }
}
