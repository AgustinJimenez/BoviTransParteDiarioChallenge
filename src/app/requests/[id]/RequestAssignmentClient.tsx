"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Fuel } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import TruckSelector from "@/components/organisms/TruckSelector";
import CapacityAlert from "@/components/molecules/CapacityAlert";
import { calculateFuelCost } from "@/lib/calculations";
import type { TransportRequest, Truck } from "@/types";

interface RequestAssignmentClientProps {
  request: TransportRequest;
  trucks: Truck[];
  fuelPrice: number;
}

const RequestAssignmentClient = ({ request, trucks, fuelPrice }: RequestAssignmentClientProps) => {
  const t = useTranslations("requestDetail");
  const router = useRouter();

  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(request.assignedTruck ?? null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacityWarning, setCapacityWarning] = useState<{ exceeded: boolean; tripsNeeded: number } | null>(null);

  const previewCost = selectedTruck && request.distanceKm
    ? calculateFuelCost(request.distanceKm, selectedTruck.fuelConsumption, fuelPrice)
    : null;

  const fuelDisplay = (): string => {
    if (previewCost != null) return `$${previewCost.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
    if (request.fuelCost != null) return `$${Number(request.fuelCost).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
    return "—";
  }

  const suggestedTruck = selectedTruck
    ? trucks.filter(tr => tr.id !== selectedTruck.id).sort((a, b) => b.maxCapacity - a.maxCapacity)[0] ?? null
    : null;

  const handleAssign = async () => {
    if (!selectedTruck) return;
    setAssigning(true);
    setError(null);
    try {
      const res = await fetch(`/api/transport-requests/${request.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ truckId: selectedTruck.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (data.capacityWarning) setCapacityWarning(data.capacityWarning);
      router.refresh();
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("sectionAssignment")}</p>
        <span className="text-xs text-gray-500">${fuelPrice.toLocaleString("es-AR")}/L</span>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
        <Fuel className="w-4 h-4 text-gray-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-500">{t("fuelEstimate")}</p>
          <p className="font-semibold text-gray-800 text-sm">{fuelDisplay()}</p>
        </div>
      </div>

      {selectedTruck && request.distanceKm && previewCost != null && (
        <div className="bg-emerald-50 rounded-xl px-3 py-2 text-xs text-emerald-700 font-mono">
          {t("fuelFormula", {
            distance: Number(request.distanceKm).toFixed(1),
            consumption: selectedTruck.fuelConsumption,
            price: fuelPrice.toLocaleString("es-AR"),
            total: previewCost.toLocaleString("es-AR", { maximumFractionDigits: 0 }),
          })}
        </div>
      )}

      <TruckSelector
        trucks={trucks}
        selectedId={selectedTruck?.id ?? null}
        onSelect={setSelectedTruck}
        distanceKm={request.distanceKm}
        fuelPrice={fuelPrice}
        currentTruckId={request.assignedTruckId}
      />

      <CapacityAlert cattleCount={request.cattleCount} truck={selectedTruck} suggestedTruck={suggestedTruck} />

      {capacityWarning?.exceeded && (
        <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
          {t("assignedWithWarning", { trips: capacityWarning.tripsNeeded })}
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <Button
        onClick={handleAssign}
        disabled={!selectedTruck || selectedTruck.id === request.assignedTruckId}
        loading={assigning}
        className="w-full"
      >
        {request.assignedTruckId ? t("reassign") : t("assign")}
      </Button>
    </div>
  );
}

export default RequestAssignmentClient;
