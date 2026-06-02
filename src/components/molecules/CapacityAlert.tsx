"use client";

import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { calculateTripsNeeded, isCapacityExceeded } from "@/lib/calculations";
import type { Truck } from "@/types";

interface Props {
  cattleCount: number;
  truck: Truck | null;
  suggestedTruck?: Truck | null;
}

const b = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

const CapacityAlert = ({ cattleCount, truck, suggestedTruck }: Props) => {
  const t = useTranslations("capacityAlert");
  if (!truck) return null;

  const exceeded = isCapacityExceeded(cattleCount, truck.maxCapacity);
  const occupancy = cattleCount / truck.maxCapacity;
  const tight = !exceeded && occupancy >= 0.9;

  if (!exceeded && !tight) {
    const free = truck.maxCapacity - cattleCount;
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-800">
          {t.rich("ok", { free, b })}
        </p>
      </div>
    );
  }

  if (tight) {
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          {t("tight", { count: cattleCount, capacity: truck.maxCapacity, percent: Math.round(occupancy * 100) })}
        </p>
      </div>
    );
  }

  const tripsNeeded = calculateTripsNeeded(cattleCount, truck.maxCapacity);

  return (
    <div className="rounded-lg bg-red-50 border border-red-100 p-3 space-y-2">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800">{t("exceededTitle")}</p>
          <p className="text-sm text-red-700">
            {t.rich("exceededBody", { capacity: truck.maxCapacity, count: cattleCount, b })}
          </p>
        </div>
      </div>
      <div className="ml-6 pl-1 space-y-1 text-sm text-red-700">
        <p>{t.rich("tripsNeeded", { trips: tripsNeeded, b })}</p>
        {suggestedTruck && (
          <p>{t.rich("suggestion", { plate: suggestedTruck.plate, capacity: suggestedTruck.maxCapacity, b })}</p>
        )}
      </div>
    </div>
  );
}

export default CapacityAlert;
