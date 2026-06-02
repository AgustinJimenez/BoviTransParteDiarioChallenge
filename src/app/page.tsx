import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import DashboardClient from "@/components/organisms/DashboardClient";
import type { TransportRequest, RequestStatus } from "@/types";

type RequestWithTruck = Prisma.TransportRequestGetPayload<{ include: { assignedTruck: true } }>;

export const dynamic = "force-dynamic";

const VALID_STATUSES: RequestStatus[] = ["PENDING", "ASSIGNED", "COMPLETED", "CANCELLED"];

function serialize(r: RequestWithTruck): TransportRequest {
  return {
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
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status: rawStatus, search } = await searchParams;

  const currentStatus = rawStatus && VALID_STATUSES.includes(rawStatus as RequestStatus)
    ? (rawStatus as RequestStatus)
    : null;
  const currentSearch = search?.trim() || null;

  const searchFilter = currentSearch
    ? {
        OR: [
          { requesterName: { contains: currentSearch, mode: "insensitive" as const } },
          { requesterPhone: { contains: currentSearch, mode: "insensitive" as const } },
          { origin: { contains: currentSearch, mode: "insensitive" as const } },
          { destination: { contains: currentSearch, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Parallel queries — stats always reflect total, cards reflect active filters
  const [statsRows, filteredRows] = await Promise.all([
    prisma.transportRequest.findMany({ select: { status: true } }),
    prisma.transportRequest.findMany({
      where: { ...(currentStatus ? { status: currentStatus } : {}), ...searchFilter },
      include: { assignedTruck: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = {
    pending:   statsRows.filter((r) => r.status === "PENDING").length,
    assigned:  statsRows.filter((r) => r.status === "ASSIGNED").length,
    completed: statsRows.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <DashboardClient
      requests={filteredRows.map(serialize)}
      stats={stats}
      currentStatus={currentStatus}
      currentSearch={currentSearch}
    />
  );
}
