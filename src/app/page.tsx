import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/domain/DashboardClient";
import type { TransportRequest } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const requests = await prisma.transportRequest.findMany({
    include: { assignedTruck: true },
    orderBy: { createdAt: "desc" },
  });

  const serialized: TransportRequest[] = requests.map((r) => ({
    ...r,
    distanceKm: r.distanceKm ? Number(r.distanceKm) : null,
    fuelCost: r.fuelCost ? Number(r.fuelCost) : null,
    originLat: r.originLat ? Number(r.originLat) : null,
    originLng: r.originLng ? Number(r.originLng) : null,
    destinationLat: r.destinationLat ? Number(r.destinationLat) : null,
    destinationLng: r.destinationLng ? Number(r.destinationLng) : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    assignedTruck: r.assignedTruck
      ? {
          ...r.assignedTruck,
          fuelConsumption: Number(r.assignedTruck.fuelConsumption),
          createdAt: r.assignedTruck.createdAt.toISOString(),
          updatedAt: r.assignedTruck.updatedAt.toISOString(),
        }
      : null,
  }));

  const stats = {
    pending:   serialized.filter((r) => r.status === "PENDING").length,
    assigned:  serialized.filter((r) => r.status === "ASSIGNED").length,
    completed: serialized.filter((r) => r.status === "COMPLETED").length,
  };

  return <DashboardClient requests={serialized} stats={stats} />;
}
