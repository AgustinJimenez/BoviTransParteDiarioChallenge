"use client";

import { useState } from "react";
import { Truck as TruckIcon, ToggleLeft, ToggleRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/atoms/Badge";
import type { Truck } from "@/types";

const TruckCardIcon = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isActive ? "bg-emerald-100" : "bg-gray-100")}>
      <TruckIcon className={cn("w-5 h-5", isActive ? "text-emerald-700" : "text-gray-400")} />
    </div>
  );
}

const TruckCardToggleButton = ({ isActive, loading, onToggle, deactivateLabel, activateLabel }: {
  isActive: boolean;
  loading: boolean;
  onToggle: () => void;
  deactivateLabel: string;
  activateLabel: string;
}) => {
  function renderIcon() {
    if (loading) return <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />;
    if (isActive) return <ToggleRight className="w-7 h-7 text-emerald-600" />;
    return <ToggleLeft className="w-7 h-7" />;
  }

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      title={isActive ? deactivateLabel : activateLabel}
      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50 transition-colors cursor-pointer"
    >
      {renderIcon()}
    </button>
  );
}

const TruckCardHeader = ({ truck, loading, onToggle, t }: {
  truck: Truck;
  loading: boolean;
  onToggle: () => void;
  t: ReturnType<typeof useTranslations>;
}) => {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <TruckCardIcon isActive={truck.isActive} />
        <div>
          <p className="font-bold text-lg text-gray-900 tracking-wide">{truck.plate}</p>
          <Badge variant={truck.isActive ? "green" : "gray"}>
            {truck.isActive ? t("active") : t("inactive")}
          </Badge>
        </div>
      </div>
      <TruckCardToggleButton
        isActive={truck.isActive}
        loading={loading}
        onToggle={onToggle}
        deactivateLabel={t("deactivate")}
        activateLabel={t("activate")}
      />
    </div>
  );
}

const TruckCardStats = ({ maxCapacity, fuelConsumption, capacityLabel, consumptionLabel }: {
  maxCapacity: number;
  fuelConsumption: number;
  capacityLabel: string;
  consumptionLabel: string;
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-emerald-700">{maxCapacity}</p>
        <p className="text-xs text-gray-500 mt-0.5">{capacityLabel}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-2xl font-bold text-gray-700">{fuelConsumption}</p>
        <p className="text-xs text-gray-500 mt-0.5">{consumptionLabel}</p>
      </div>
    </div>
  );
}

interface Props {
  truck: Truck;
  onToggle: (truck: Truck) => Promise<void>;
}

const TruckCard = ({ truck, onToggle }: Props) => {
  const t = useTranslations("truckCard");
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try { await onToggle(truck); } finally { setLoading(false); }
  }

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-opacity", !truck.isActive && "opacity-60")}>
      <div className="p-5 space-y-4">
        <TruckCardHeader truck={truck} loading={loading} onToggle={handleToggle} t={t} />
        <TruckCardStats
          maxCapacity={truck.maxCapacity}
          fuelConsumption={truck.fuelConsumption}
          capacityLabel={t("capacityLabel")}
          consumptionLabel={t("consumptionLabel")}
        />
      </div>
    </div>
  );
}

export default TruckCard;
