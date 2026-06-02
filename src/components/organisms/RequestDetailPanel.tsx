"use client";

import { useEffect, useState } from "react";
import { X, Ruler, Fuel, Phone, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/atoms/Badge";
import RouteMap from "@/components/molecules/RouteMap";
import TruckSelector from "./TruckSelector";
import CapacityAlert from "@/components/molecules/CapacityAlert";
import { calculateFuelCost } from "@/lib/calculations";
import type { TransportRequest, Truck } from "@/types";

interface Props {
  requestId: string;
  onClose: () => void;
  onAssigned: () => void;
}

export default function RequestDetailPanel({ requestId, onClose, onAssigned }: Props) {
  const t = useTranslations("requestDetail");
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [fuelPrice, setFuelPrice] = useState(1250);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacityWarning, setCapacityWarning] = useState<{ exceeded: boolean; tripsNeeded: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [reqRes, trucksRes, priceRes] = await Promise.all([
          fetch(`/api/transport-requests/${requestId}`),
          fetch("/api/trucks?active=true"),
          fetch("/api/config/fuel-price"),
        ]);
        const [reqData, trucksData, priceData] = await Promise.all([
          reqRes.json(), trucksRes.json(), priceRes.json(),
        ]);
        if (cancelled) return;

        if (reqData.data) {
          setRequest(reqData.data);
          setSelectedTruck(reqData.data.assignedTruck ?? null);
        }
        if (trucksData.data) setTrucks(trucksData.data);
        if (priceData.data) setFuelPrice(priceData.data.price);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [requestId]);

  async function handleAssign() {
    if (!selectedTruck || !request) return;
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
      setRequest(data.data);
      onAssigned();
    } finally {
      setAssigning(false);
    }
  }

  const previewCost = selectedTruck && request?.distanceKm
    ? calculateFuelCost(request.distanceKm, selectedTruck.fuelConsumption, fuelPrice)
    : null;

  const suggestedTruck = selectedTruck
    ? trucks.filter(t => t.id !== selectedTruck.id).sort((a, b) => b.maxCapacity - a.maxCapacity)[0] ?? null
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 rounded-full bg-emerald-600" />
            <div>
              <p className="text-xs text-gray-400 font-mono">{request?.id.slice(0, 8).toUpperCase()}</p>
              {request && <StatusBadge status={request.status} />}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !request ? (
            <p className="p-5 text-gray-500">{t("loadError")}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Requester */}
              <div className="px-5 py-4 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("sectionRequester")}</p>
                <div className="flex items-center gap-2 text-gray-800">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{request.requesterName}</span>
                </div>
                {request.requesterPhone && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{request.requesterPhone}</span>
                  </div>
                )}
              </div>

              {/* Cargo */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("sectionCargo")}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-700">{request.cattleCount}</span>
                  <span className="text-gray-500">{t("cattleUnit")}</span>
                </div>
              </div>

              {/* Route + Map */}
              <div className="px-5 py-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("sectionRoute")}</p>
                <div className="flex items-start gap-3 text-sm">
                  <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div className="w-0.5 h-6 bg-gray-200" />
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400">{t("origin")}</p>
                      <p className="font-medium text-gray-800">{request.origin}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t("destination")}</p>
                      <p className="font-medium text-gray-800">{request.destination}</p>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="h-52 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <RouteMap
                    originLat={request.originLat}
                    originLng={request.originLng}
                    destinationLat={request.destinationLat}
                    destinationLng={request.destinationLng}
                    origin={request.origin}
                    destination={request.destination}
                  />
                </div>

                {/* Distance + Cost stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
                    <Ruler className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{t("distance")}</p>
                      <p className="font-semibold text-gray-800 text-sm">
                        {request.distanceKm != null ? `${Number(request.distanceKm).toLocaleString("es-AR")} km` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
                    <Fuel className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{t("fuelEstimate")}</p>
                      <p className="font-semibold text-gray-800 text-sm">
                        {previewCost != null
                          ? `$${previewCost.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
                          : request.fuelCost != null
                          ? `$${Number(request.fuelCost).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fuel formula breakdown */}
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
              </div>

              {/* Truck Assignment */}
              {request.status !== "COMPLETED" && request.status !== "CANCELLED" && (
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("sectionAssignment")}</p>
                    <span className="text-xs text-gray-400">${fuelPrice.toLocaleString("es-AR")}/L</span>
                  </div>

                  <TruckSelector
                    trucks={trucks}
                    selectedId={selectedTruck?.id ?? null}
                    onSelect={setSelectedTruck}
                    distanceKm={request.distanceKm}
                    fuelPrice={fuelPrice}
                    currentTruckId={request.assignedTruckId}
                  />

                  <CapacityAlert
                    cattleCount={request.cattleCount}
                    truck={selectedTruck}
                    suggestedTruck={suggestedTruck}
                  />

                  {capacityWarning?.exceeded && (
                    <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">
                      {t("assignedWithWarning", { trips: capacityWarning.tripsNeeded })}
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}
                </div>
              )}

              {request.status === "COMPLETED" && (
                <div className="px-5 py-4">
                  <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700 text-center">
                    {t("completedBanner")}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {request && request.status !== "COMPLETED" && request.status !== "CANCELLED" && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                {t("close")}
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedTruck || selectedTruck.id === request.assignedTruckId}
                loading={assigning}
                className="flex-1"
              >
                {request.assignedTruckId ? t("reassign") : t("assign")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
