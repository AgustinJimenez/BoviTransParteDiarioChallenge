import { notFound } from "next/navigation";
import { Phone, User, Ruler, Fuel, Truck as TruckIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { geocodeLocation } from "@/lib/geocoding";
import { getRoadDistanceKm } from "@/lib/routing";
import { StatusBadge } from "@/components/atoms/Badge";
import RouteMap from "@/components/molecules/RouteMap";
import BackButton from "./BackButton";
import RequestAssignmentClient from "./RequestAssignmentClient";
import type { TransportRequest, Truck, RequestStatus } from "@/types";

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

interface RequestDetailHeaderProps {
  status: RequestStatus;
  date: string;
}

interface RequestRouteSectionProps {
  request: TransportRequest;
  sectionLabel: string;
  originLabel: string;
  destinationLabel: string;
  distanceLabel: string;
}

interface RequestRequesterCardProps {
  request: TransportRequest;
  sectionLabel: string;
}

interface RequestCargoCardProps {
  cattleCount: number;
  sectionLabel: string;
  cattleUnit: string;
}

interface RequestCompletedBannerProps {
  label: string;
}

interface RequestCompletedAssignmentProps {
  request: TransportRequest;
  fuelPrice: number;
  sectionLabel: string;
  fuelEstimateLabel: string;
  fuelFormula: string;
  completedBannerLabel: string;
}

type RequestWithTruck = Prisma.TransportRequestGetPayload<{ include: { assignedTruck: true } }>;
type TruckRow = Awaited<ReturnType<typeof prisma.truck.findMany>>[number];

const serializeTruck = (t: TruckRow): Truck => ({
  id: t.id,
  plate: t.plate,
  maxCapacity: t.maxCapacity,
  fuelConsumption: Number(t.fuelConsumption),
  isActive: t.isActive,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
});

const serializeRequest = (r: RequestWithTruck): TransportRequest => ({
  ...r,
  distanceKm: r.distanceKm ? Number(r.distanceKm) : null,
  fuelCost: r.fuelCost ? Number(r.fuelCost) : null,
  originLat: r.originLat ? Number(r.originLat) : null,
  originLng: r.originLng ? Number(r.originLng) : null,
  destinationLat: r.destinationLat ? Number(r.destinationLat) : null,
  destinationLng: r.destinationLng ? Number(r.destinationLng) : null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
  assignedTruck: r.assignedTruck ? {
    id: r.assignedTruck.id,
    plate: r.assignedTruck.plate,
    maxCapacity: r.assignedTruck.maxCapacity,
    fuelConsumption: Number(r.assignedTruck.fuelConsumption),
    isActive: r.assignedTruck.isActive,
    createdAt: r.assignedTruck.createdAt.toISOString(),
    updatedAt: r.assignedTruck.updatedAt.toISOString(),
  } : null,
});

const RouteStopIndicator = () => (
  <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
    <div className="w-3 h-3 rounded-full bg-emerald-500" />
    <div className="w-0.5 h-6 bg-gray-200" />
    <div className="w-3 h-3 rounded-full bg-red-500" />
  </div>
);

const RequestDetailHeader = ({ status, date }: RequestDetailHeaderProps) => (
  <div className="mt-6 mb-8 flex items-center gap-4">
    <BackButton />
    <StatusBadge status={status} />
    <span className="text-gray-300">·</span>
    <span className="text-sm text-gray-500">{date}</span>
  </div>
);

const RequestRouteSection = ({ request, sectionLabel, originLabel, destinationLabel, distanceLabel }: RequestRouteSectionProps) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{sectionLabel}</p>
    <div className="flex items-start gap-3 text-sm">
      <RouteStopIndicator />
      <div className="space-y-3 flex-1">
        <div>
          <p className="text-xs text-gray-500">{originLabel}</p>
          <p className="font-medium text-gray-800">{request.origin}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{destinationLabel}</p>
          <p className="font-medium text-gray-800">{request.destination}</p>
        </div>
      </div>
    </div>
    <div className="h-72 rounded-xl overflow-hidden border border-gray-100">
      <RouteMap
        originLat={request.originLat}
        originLng={request.originLng}
        destinationLat={request.destinationLat}
        destinationLng={request.destinationLng}
        origin={request.origin}
        destination={request.destination}
      />
    </div>
    {request.distanceKm != null && (
      <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
        <Ruler className="w-4 h-4 text-gray-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-500">{distanceLabel}</p>
          <p className="font-semibold text-gray-800 text-sm">
            {Number(request.distanceKm).toLocaleString("es-AR")} km
          </p>
        </div>
      </div>
    )}
  </div>
);

const RequestRequesterCard = ({ request, sectionLabel }: RequestRequesterCardProps) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{sectionLabel}</p>
    <div className="flex items-center gap-2 text-gray-800">
      <User className="w-4 h-4 text-gray-400" />
      <h1 className="font-semibold text-base">{request.requesterName}</h1>
    </div>
    {request.requesterPhone && (
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <Phone className="w-4 h-4 text-gray-400" />
        <span>{request.requesterPhone}</span>
      </div>
    )}
  </div>
);

const RequestCargoCard = ({ cattleCount, sectionLabel, cattleUnit }: RequestCargoCardProps) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{sectionLabel}</p>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-bold text-emerald-700">{cattleCount}</span>
      <span className="text-gray-500">{cattleUnit}</span>
    </div>
  </div>
);

const RequestCompletedBanner = ({ label }: RequestCompletedBannerProps) => (
  <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 text-sm text-emerald-700 text-center font-medium">
    {label}
  </div>
);

const RequestCompletedAssignment = ({ request, fuelPrice, sectionLabel, fuelEstimateLabel, fuelFormula, completedBannerLabel }: RequestCompletedAssignmentProps) => {
  const truck = request.assignedTruck;
  const fuelCost = request.fuelCost;
  const distanceKm = request.distanceKm;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{sectionLabel}</p>
        <span className="text-xs text-gray-500">Gs. {fuelPrice.toLocaleString("es-AR")}/L</span>
      </div>

      {fuelCost != null && (
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
          <Fuel className="w-4 h-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">{fuelEstimateLabel}</p>
            <p className="font-semibold text-gray-800 text-sm">
              Gs. {fuelCost.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {truck && distanceKm != null && fuelCost != null && (
        <div className="bg-emerald-50 rounded-xl px-3 py-2 text-xs text-emerald-700 font-mono">
          {fuelFormula
            .replace("{distance}", distanceKm.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }))
            .replace("{consumption}", truck.fuelConsumption.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
            .replace("{price}", fuelPrice.toLocaleString("es-AR"))
            .replace("{total}", fuelCost.toLocaleString("es-AR", { maximumFractionDigits: 0 }))}
        </div>
      )}

      {truck && (
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <TruckIcon className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{truck.plate}</p>
            <p className="text-xs text-gray-500">
              Cap. {truck.maxCapacity} cab. · {truck.fuelConsumption.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L/km
            </p>
          </div>
        </div>
      )}

      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-3 text-sm text-emerald-700 text-center font-medium">
        {completedBannerLabel}
      </div>
    </div>
  );
};

export const dynamic = "force-dynamic";

const RequestDetailPage = async ({ params }: RequestDetailPageProps) => {
  const { id } = await params;
  const t = await getTranslations("requestDetail");

  const [requestRaw, trucksRaw, priceConfig] = await Promise.all([
    prisma.transportRequest.findUnique({ where: { id }, include: { assignedTruck: true } }),
    prisma.truck.findMany({ where: { isActive: true }, orderBy: { plate: "asc" } }),
    prisma.systemConfig.findUnique({ where: { key: "fuel_price_per_liter" } }),
  ]);

  if (!requestRaw) notFound();

  // Geocoding + routing enrichment — results cached in DB after first call
  const updates: Record<string, unknown> = {};
  let req = requestRaw;
  let oLat = req.originLat ? Number(req.originLat) : null;
  let oLng = req.originLng ? Number(req.originLng) : null;
  let dLat = req.destinationLat ? Number(req.destinationLat) : null;
  let dLng = req.destinationLng ? Number(req.destinationLng) : null;

  if (!oLat || !oLng) {
    const coords = await geocodeLocation(req.origin);
    if (coords) { oLat = coords.lat; oLng = coords.lng; updates.originLat = coords.lat; updates.originLng = coords.lng; }
  }
  if (!dLat || !dLng) {
    const coords = await geocodeLocation(req.destination);
    if (coords) { dLat = coords.lat; dLng = coords.lng; updates.destinationLat = coords.lat; updates.destinationLng = coords.lng; }
  }
  if (!req.distanceKm && oLat && oLng && dLat && dLng) {
    const km = await getRoadDistanceKm(oLat, oLng, dLat, dLng);
    updates.distanceKm = km;
  }
  if (Object.keys(updates).length > 0) {
    req = await prisma.transportRequest.update({ where: { id }, data: updates, include: { assignedTruck: true } });
  }

  const request = serializeRequest(req);
  const trucks = trucksRaw.map(serializeTruck);
  const fuelPrice = priceConfig ? parseFloat(priceConfig.value) : 1250;
  const isActionable = request.status !== "COMPLETED" && request.status !== "CANCELLED";
  const date = new Date(request.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RequestDetailHeader status={request.status} date={date} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RequestRouteSection
            request={request}
            sectionLabel={t("sectionRoute")}
            originLabel={t("origin")}
            destinationLabel={t("destination")}
            distanceLabel={t("distance")}
          />
        </div>

        <div className="lg:col-span-5 space-y-4">
          <RequestRequesterCard request={request} sectionLabel={t("sectionRequester")} />
          <RequestCargoCard
            cattleCount={request.cattleCount}
            sectionLabel={t("sectionCargo")}
            cattleUnit={t("cattleUnit")}
          />
          {isActionable && (
            <RequestAssignmentClient request={request} trucks={trucks} fuelPrice={fuelPrice} />
          )}
          {request.status === "COMPLETED" && (
            <RequestCompletedAssignment
              request={request}
              fuelPrice={fuelPrice}
              sectionLabel={t("sectionAssignment")}
              fuelEstimateLabel={t("fuelEstimate")}
              fuelFormula={t("fuelFormula")}
              completedBannerLabel={t("completedBanner")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestDetailPage;
