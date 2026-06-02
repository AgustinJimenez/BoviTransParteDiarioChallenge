"use client";

import { useState } from "react";
import { Truck as TruckIcon, ToggleLeft, ToggleRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/atoms/Badge";
import type { Truck } from "@/types";

interface Props {
  truck: Truck;
  onToggle: (truck: Truck) => Promise<void>;
}

export default function TruckCard({ truck, onToggle }: Props) {
  const t = useTranslations("truckCard");
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try { await onToggle(truck); } finally { setLoading(false); }
  }

  function renderToggleIcon() {
    if (loading) return <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />;
    if (truck.isActive) return <ToggleRight className="w-7 h-7 text-emerald-600" />;
    return <ToggleLeft className="w-7 h-7" />;
  }

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-opacity",
      !truck.isActive && "opacity-60"
    )}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              truck.isActive ? "bg-emerald-100" : "bg-gray-100"
            )}>
              <TruckIcon className={cn("w-5 h-5", truck.isActive ? "text-emerald-700" : "text-gray-400")} />
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900 tracking-wide">{truck.plate}</p>
              <Badge variant={truck.isActive ? "green" : "gray"}>
                {truck.isActive ? t("active") : t("inactive")}
              </Badge>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            title={truck.isActive ? t("deactivate") : t("activate")}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {renderToggleIcon()}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{truck.maxCapacity}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t("capacityLabel")}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{truck.fuelConsumption}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t("consumptionLabel")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
