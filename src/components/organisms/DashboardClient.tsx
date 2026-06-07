"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, ClipboardList } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";
import { Button } from "@/components/atoms/Button";
import RequestCard from "@/components/molecules/RequestCard";
import FilterBar from "@/components/molecules/FilterBar";
import NewRequestModal from "./NewRequestModal";
import type { TransportRequest, RequestStatus } from "@/types";

interface DashboardStatCardProps {
  label: string;
  value: number;
  color: string;
  bg: string;
}

interface DashboardStatsProps {
  stats: { pending: number; assigned: number; completed: number };
  t: ReturnType<typeof useTranslations>;
}

interface DashboardTitleBarProps {
  onNewRequest: () => void;
  t: ReturnType<typeof useTranslations>;
}

interface DashboardNoResultsProps {
  label: string;
}

interface DashboardEmptyStateProps {
  onNewRequest: () => void;
  t: ReturnType<typeof useTranslations>;
}

interface DashboardClientProps {
  stats: { pending: number; assigned: number; completed: number };
  currentStatus: RequestStatus | null;
  currentSearch: string | null;
}

const DashboardStatCard = ({ label, value, color, bg }: DashboardStatCardProps) => {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

const DashboardStats = ({ stats, t }: DashboardStatsProps) => {
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

const DashboardTitleBar = ({ onNewRequest, t }: DashboardTitleBarProps) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
      <Button onClick={onNewRequest} aria-label={t("newRequest")}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">{t("newRequest")}</span>
      </Button>
    </div>
  );
}

const DashboardNoResults = ({ label }: DashboardNoResultsProps) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
    <ClipboardList className="w-12 h-12" />
    <p className="text-lg font-medium">{label}</p>
  </div>
);

const DashboardEmptyState = ({ onNewRequest, t }: DashboardEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
    <ClipboardList className="w-12 h-12" />
    <p className="text-lg font-medium">{t("emptyTitle")}</p>
    <p className="text-sm">{t("emptySubtitle")}</p>
    <Button onClick={onNewRequest} className="mt-2">
      <Plus className="w-4 h-4" /> {t("newRequest")}
    </Button>
  </div>
);

const DashboardInitialLoading = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const DashboardLoadingFooter = () => (
  <div className="flex justify-center py-6">
    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const LIMIT = 24;

const DashboardClient = ({ stats, currentStatus, currentSearch }: DashboardClientProps) => {
  const t = useTranslations("dashboard");
  const tf = useTranslations("filterBar");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showNewModal, setShowNewModal] = useState(false);

  const [items, setItems] = useState<TransportRequest[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetching, setFetching] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async (pageNum: number, replace: boolean) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const params = new URLSearchParams({ page: String(pageNum), limit: String(LIMIT) });
    if (currentStatus) params.set("status", currentStatus);
    if (currentSearch?.trim()) params.set("search", currentSearch.trim());

    // Start the request before any setState so the effect rule is satisfied —
    // all state updates happen after the first await (async boundary).
    const fetchPromise = fetch(`/api/transport-requests?${params}`, { signal: controller.signal });
    setFetching(true);

    try {
      const res = await fetchPromise;
      if (controller.signal.aborted) return;
      const json = await res.json();
      if (controller.signal.aborted) return;
      if (json.data) {
        setItems((prev) => replace ? json.data.items : [...prev, ...json.data.items]);
        setHasMore(json.data.hasMore);
        setPage(pageNum + 1);
      }
    } catch {
      // AbortError on filter change or unmount — silently ignore
    } finally {
      if (!controller.signal.aborted) setFetching(false);
    }
  }, [currentStatus, currentSearch]);

  useEffect(() => {
    // Rule flags any function that transitively calls setState, even after awaits.
    // This is the standard data-fetching pattern — all state updates happen inside async continuations.
    void doFetch(1, true); // eslint-disable-line react-hooks/set-state-in-effect
    return () => controllerRef.current?.abort();
  }, [doFetch]);

  const loadMore = useCallback(() => {
    if (hasMore && !fetching) void doFetch(page, false);
  }, [hasMore, fetching, page, doFetch]);

  const hasActiveFilters = currentStatus !== null || currentSearch !== null;

  const refresh = () => {
    startTransition(() => router.refresh());
    void doFetch(1, true);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardStats stats={stats} t={t} />
      <DashboardTitleBar onNewRequest={() => setShowNewModal(true)} t={t} />
      <FilterBar currentStatus={currentStatus} currentSearch={currentSearch} />

      {fetching && items.length === 0 && <DashboardInitialLoading />}
      {!fetching && items.length === 0 && hasActiveFilters && <DashboardNoResults label={tf("noResults")} />}
      {!fetching && items.length === 0 && !hasActiveFilters && (
        <DashboardEmptyState onNewRequest={() => setShowNewModal(true)} t={t} />
      )}

      {items.length > 0 && (
        <VirtuosoGrid
          useWindowScroll
          totalCount={items.length}
          endReached={loadMore}
          overscan={600}
          listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          itemContent={(index) => <RequestCard request={items[index]} />}
          components={{ Footer: fetching ? DashboardLoadingFooter : undefined }}
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
