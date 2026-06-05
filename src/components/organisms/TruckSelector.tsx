"use client";

import { Truck as TruckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { calculateFuelCost } from "@/lib/calculations";
import type { Truck } from "@/types";

interface Props {
  trucks: Truck[];
  selectedId: string | null;
  onSelect: (truck: Truck | null) => void;
  distanceKm: number | null;
  fuelPrice: number;
  currentTruckId?: string | null;
}

const TruckSelector = ({ trucks, selectedId, onSelect, distanceKm, fuelPrice, currentTruckId }: Props) => {
  const t = useTranslations("truckSelector");

  if (!trucks.length) {
    return (
      <p className="text-sm text-gray-500 italic">{t("empty")}</p>
    );
  }

  return (
    <div className="space-y-2">
      {trucks.map((truck) => {
        const selected = selectedId === truck.id;
        const isCurrentlyAssigned = currentTruckId === truck.id;
        const fuelCost = distanceKm
          ? calculateFuelCost(distanceKm, truck.fuelConsumption, fuelPrice)
          : null;

        return (
          <button
            key={truck.id}
            type="button"
            onClick={() => onSelect(selected ? null : truck)}
            className={cn(
              "w-full text-left rounded-xl border-2 p-3 transition-all",
              selected
                ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  selected ? "bg-emerald-600" : "bg-gray-100"
                )}>
                  <TruckIcon className={cn("w-4 h-4", selected ? "text-white" : "text-gray-500")} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{truck.plate}</span>
                    {isCurrentlyAssigned && (
                      <span className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-medium">{t("current")}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {t("capacityHint", { capacity: truck.maxCapacity, consumption: truck.fuelConsumption })}
                  </p>
                </div>
              </div>

              {fuelCost != null && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{t("fuelLabel")}</p>
                  <p className={cn("text-sm font-bold", selected ? "text-emerald-700" : "text-gray-700")}>
                    ${fuelCost.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default TruckSelector;
