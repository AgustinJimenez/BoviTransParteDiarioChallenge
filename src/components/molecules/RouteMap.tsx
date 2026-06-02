"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

const MapLoadingFallback = () => {
  const t = useTranslations("map");
  return (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl text-gray-400 text-sm gap-2">
      <div className="animate-pulse w-4 h-4 bg-gray-300 rounded-full" />
      {t("loading")}
    </div>
  );
}

const MapInner = dynamic(() => import("@/components/organisms/MapInner"), {
  ssr: false,
  loading: MapLoadingFallback,
});

interface Props {
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  origin: string;
  destination: string;
}

const RouteMap = ({ originLat, originLng, destinationLat, destinationLng, origin, destination }: Props) => {
  const t = useTranslations("map");

  if (!originLat || !originLng || !destinationLat || !destinationLng) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 gap-2 text-sm">
        <MapPin className="w-6 h-6" />
        <p>{t("noCoordinates")}</p>
        <p className="text-xs text-gray-400">{origin} → {destination}</p>
      </div>
    );
  }

  return (
    <MapInner
      originLat={originLat}
      originLng={originLng}
      destinationLat={destinationLat}
      destinationLng={destinationLng}
      originLabel={origin}
      destinationLabel={destination}
    />
  );
}

export default RouteMap;
