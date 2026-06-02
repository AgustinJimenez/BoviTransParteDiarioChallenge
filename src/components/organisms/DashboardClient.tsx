"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import RequestCard from "@/components/molecules/RequestCard";
import FilterBar from "@/components/molecules/FilterBar";
import RequestDetailPanel from "./RequestDetailPanel";
import NewRequestModal from "./NewRequestModal";
import type { TransportRequest, RequestStatus } from "@/types";

const DashboardStatCard = ({ label, value, color, bg }: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) => {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

const DashboardStats = ({ stats, t }: {
  stats: { pending: number; assigned: number; completed: number };
  t: ReturnType<typeof useTranslations>;
}) => {
  const items = [
    { label: t("statPending"),   value: stats.pending,   color: "text-amber-700",   bg: "bg-amber-50 border-amber-100" },
    { label: t("statAssigned"),  value: stats.assigned,  color: "text-sky-700",     bg: "bg-sky-50 border-sky-100" },
    { label: t("statCompleted"), value: stats.completed, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {items.map(({ label, value, color, bg }) => (
        <DashboardStatCard key={label} label={label} value={value} color={color} bg={bg} />
      ))}
    </div>
  );
}

const DashboardTitleBar = ({ onNewRequest, t }: {
  onNewRequest: () => void;
  t: ReturnType<typeof useTranslations>;
}) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
      <Button onClick={onNewRequest}>
        <Plus className="w-4 h-4" />
        {t("newRequest")}
      </Button>
    </div>
  );
}

interface Props {
  requests: TransportRequest[];
  stats: { pending: number; assigned: number; completed: number };
  currentStatus: RequestStatus | null;
  currentSearch: string | null;
}

const DashboardClient = ({ requests, stats, currentStatus, currentSearch }: Props) => {
  const t = useTranslations("dashboard");
  const tf = useTranslations("filterBar");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const hasActiveFilters = currentStatus !== null || currentSearch !== null;

  function renderCards() {
    if (requests.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              selected={selectedId === r.id}
              onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
            />
          ))}
        </div>
      );
    }
    if (hasActiveFilters) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <ClipboardList className="w-12 h-12" />
          <p className="text-lg font-medium">{tf("noResults")}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <ClipboardList className="w-12 h-12" />
        <p className="text-lg font-medium">{t("emptyTitle")}</p>
        <p className="text-sm">{t("emptySubtitle")}</p>
        <Button onClick={() => setShowNewModal(true)} className="mt-2">
          <Plus className="w-4 h-4" /> {t("newRequest")}
        </Button>
      </div>
    );
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardStats stats={stats} t={t} />
      <DashboardTitleBar onNewRequest={() => setShowNewModal(true)} t={t} />
      <FilterBar currentStatus={currentStatus} currentSearch={currentSearch} />
      {renderCards()}

      {selectedId && (
        <RequestDetailPanel
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
          onAssigned={() => { refresh(); }}
        />
      )}

      {showNewModal && (
        <NewRequestModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => { refresh(); }}
        />
      )}
    </div>
  );
}

export default DashboardClient;
