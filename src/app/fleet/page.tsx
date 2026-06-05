"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, Truck as TruckIcon } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import TruckCard from "@/components/molecules/TruckCard";
import type { Truck } from "@/types";

interface FleetEmptyStateProps {
  t: ReturnType<typeof useTranslations>;
}

interface FleetTruckGridProps {
  active: Truck[];
  inactive: Truck[];
  onToggle: (truck: Truck) => Promise<void>;
  t: ReturnType<typeof useTranslations>;
}

interface FleetPageHeaderProps {
  activeCount: number;
  inactiveCount: number;
  t: ReturnType<typeof useTranslations>;
}

const FleetLoadingState = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const FleetEmptyState = ({ t }: FleetEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
    <TruckIcon className="w-12 h-12" />
    <p className="text-lg font-medium">{t("emptyTitle")}</p>
    <p className="text-sm">{t("emptySubtitle")}</p>
    <Link href="/fleet/new">
      <Button className="mt-2"><Plus className="w-4 h-4" /> {t("register")}</Button>
    </Link>
  </div>
);

const FleetTruckGrid = ({ active, inactive, onToggle, t }: FleetTruckGridProps) => (
  <div className="space-y-8">
    {active.length > 0 && (
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{t("sectionActive")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {active.map((truck) => <TruckCard key={truck.id} truck={truck} onToggle={onToggle} />)}
        </div>
      </section>
    )}
    {inactive.length > 0 && (
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{t("sectionInactive")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {inactive.map((truck) => <TruckCard key={truck.id} truck={truck} onToggle={onToggle} />)}
        </div>
      </section>
    )}
  </div>
);

const FleetPageHeader = ({ activeCount, inactiveCount, t }: FleetPageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("activeTrucks", { count: activeCount })}
          {inactiveCount > 0 && t("inactiveTrucks", { count: inactiveCount })}
        </p>
      </div>
      <Link href="/fleet/new">
        <Button>
          <Plus className="w-4 h-4" />
          {t("register")}
        </Button>
      </Link>
    </div>
  );
}

const FleetPage = () => {
  const t = useTranslations("fleet");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTrucks = async () => {
      const res = await fetch("/api/trucks");
      const data = await res.json();
      if (cancelled) return;
      if (data.data) setTrucks(data.data);
      setLoading(false);
    }

    void loadTrucks();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = async (truck: Truck) => {
    const res = await fetch(`/api/trucks/${truck.id}`, { method: "PATCH" });
    const data = await res.json();
    if (data.data) {
      setTrucks((prev) => prev.map((t) => t.id === truck.id ? data.data : t));
      startTransition(() => router.refresh());
    }
  }

  const active   = trucks.filter((t) => t.isActive);
  const inactive = trucks.filter((t) => !t.isActive);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FleetPageHeader activeCount={active.length} inactiveCount={inactive.length} t={t} />
      {loading && <FleetLoadingState />}
      {!loading && trucks.length === 0 && <FleetEmptyState t={t} />}
      {!loading && trucks.length > 0 && <FleetTruckGrid active={active} inactive={inactive} onToggle={handleToggle} t={t} />}
    </div>
  );
}

export default FleetPage;
