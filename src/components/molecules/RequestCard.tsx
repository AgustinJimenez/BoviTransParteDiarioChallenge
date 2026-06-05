"use client";

import Link from "next/link";
import { ArrowRight, Phone, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/atoms/Badge";
import { cn } from "@/lib/utils";
import type { TransportRequest } from "@/types";

interface CardHeaderProps {
  status: TransportRequest["status"];
  date: string;
}

interface CardRequesterProps {
  name: string;
  phone: string | null;
}

interface CardCattleCountProps {
  count: number;
  unit: string;
}

interface CardRouteProps {
  origin: string;
  destination: string;
}

interface CardAssignedTruckProps {
  truck: TransportRequest["assignedTruck"];
  fuelCost: number | null;
  placeholder: string;
}

interface RequestCardProps {
  request: TransportRequest;
}

const statusBorder: Record<string, string> = {
  PENDING:   "border-l-amber-400",
  ASSIGNED:  "border-l-sky-400",
  COMPLETED: "border-l-emerald-400",
  CANCELLED: "border-l-gray-300",
};

const CardHeader = ({ status, date }: CardHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-2">
      <StatusBadge status={status} />
      <span className="text-xs text-gray-500 shrink-0">{date}</span>
    </div>
  );
}

const CardRequester = ({ name, phone }: CardRequesterProps) => {
  return (
    <div>
      <p className="font-semibold text-gray-900 text-base leading-tight">{name}</p>
      {phone && (
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <Phone className="w-3 h-3" />{phone}
        </p>
      )}
    </div>
  );
}

const CardCattleCount = ({ count, unit }: CardCattleCountProps) => {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-2xl font-bold text-emerald-700">{count}</span>
      <span className="text-sm text-gray-500">{unit}</span>
    </div>
  );
}

const CardRoute = ({ origin, destination }: CardRouteProps) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="truncate max-w-[40%]">{origin}</span>
      <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="truncate max-w-[40%]">{destination}</span>
    </div>
  );
}

const CardAssignedTruck = ({ truck, fuelCost, placeholder }: CardAssignedTruckProps) => {
  if (!truck) return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5">
      <Truck className="w-3.5 h-3.5 shrink-0" />
      <span>{placeholder}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 rounded-lg px-2.5 py-1.5">
      <Truck className="w-3.5 h-3.5 shrink-0" />
      <span>{truck.plate}</span>
      {fuelCost != null && (
        <span className="ml-auto font-semibold">
          ${fuelCost.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
        </span>
      )}
    </div>
  );
}

const RequestCard = ({ request }: RequestCardProps) => {
  const t = useTranslations("requestCard");
  const date = new Date(request.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

  return (
    <Link
      href={`/requests/${request.id}`}
      data-testid="request-card"
      className={cn(
        "flex flex-col h-52 bg-white rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        statusBorder[request.status] ?? "border-l-gray-300"
      )}
    >
      <div className="flex flex-col flex-1 p-4 gap-3 overflow-hidden">
        <CardHeader status={request.status} date={date} />
        <CardRequester name={request.requesterName} phone={request.requesterPhone} />
        <CardCattleCount count={request.cattleCount} unit={t("cattleUnit")} />
        <CardRoute origin={request.origin} destination={request.destination} />
        <div className="mt-auto">
          <CardAssignedTruck truck={request.assignedTruck} fuelCost={request.fuelCost} placeholder={t("noTruck")} />
        </div>
      </div>
    </Link>
  );
}

export default RequestCard;
