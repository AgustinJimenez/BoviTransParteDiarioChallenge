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

interface Props {
  requests: TransportRequest[];
  stats: { pending: number; assigned: number; completed: number };
  currentStatus: RequestStatus | null;
  currentSearch: string | null;
}

export default function DashboardClient({ requests, stats, currentStatus, currentSearch }: Props) {
  const t = useTranslations("dashboard");
  const tf = useTranslations("filterBar");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const hasActiveFilters = currentStatus !== null || currentSearch !== null;

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t("statPending"),   value: stats.pending,   color: "text-amber-700",   bg: "bg-amber-50 border-amber-100" },
          { label: t("statAssigned"),  value: stats.assigned,  color: "text-sky-700",     bg: "bg-sky-50 border-sky-100" },
          { label: t("statCompleted"), value: stats.completed, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Title + CTA */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4" />
          {t("newRequest")}
        </Button>
      </div>

      {/* Filters */}
      <FilterBar currentStatus={currentStatus} currentSearch={currentSearch} />

      {/* Cards grid */}
      {requests.length === 0 ? (
        hasActiveFilters ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <ClipboardList className="w-12 h-12" />
            <p className="text-lg font-medium">{tf("noResults")}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <ClipboardList className="w-12 h-12" />
            <p className="text-lg font-medium">{t("emptyTitle")}</p>
            <p className="text-sm">{t("emptySubtitle")}</p>
            <Button onClick={() => setShowNewModal(true)} className="mt-2">
              <Plus className="w-4 h-4" /> {t("newRequest")}
            </Button>
          </div>
        )
      ) : (
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
      )}

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
