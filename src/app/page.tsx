import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/organisms/DashboardClient";
import type { RequestStatus } from "@/types";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

const VALID_STATUSES: RequestStatus[] = ["PENDING", "ASSIGNED", "COMPLETED", "CANCELLED"];

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const { status: rawStatus, search } = await searchParams;

  const currentStatus = rawStatus && VALID_STATUSES.includes(rawStatus as RequestStatus)
    ? (rawStatus as RequestStatus)
    : null;
  const currentSearch = search?.trim() || null;

  // Stats are always global — unaffected by active filters
  const statsRows = await prisma.transportRequest.findMany({ select: { status: true } });
  const stats = {
    pending:   statsRows.filter((r) => r.status === "PENDING").length,
    assigned:  statsRows.filter((r) => r.status === "ASSIGNED").length,
    completed: statsRows.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <DashboardClient
      stats={stats}
      currentStatus={currentStatus}
      currentSearch={currentSearch}
    />
  );
}

export default DashboardPage;
