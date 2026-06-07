"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useTranslations } from "next-intl";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapInnerProps {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  originLabel: string;
  destinationLabel: string;
}

interface FitBoundsProps {
  positions: [number, number][];
}

// Fix default Leaflet marker icons in Next.js
const originIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#16a34a;border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#dc2626;border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const FitBounds = ({ positions }: FitBoundsProps) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

const MapInner = ({ originLat, originLng, destinationLat, destinationLng, originLabel, destinationLabel }: MapInnerProps) => {
  const t = useTranslations("map");
  const origin: [number, number] = [originLat, originLng];
  const destination: [number, number] = [destinationLat, destinationLng];

  return (
    <MapContainer
      center={origin}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds positions={[origin, destination]} />
      <Marker position={origin} icon={originIcon} title={`${t("origin")}: ${originLabel}`}>
        <Popup><strong>{t("origin")}</strong><br />{originLabel}</Popup>
      </Marker>
      <Marker position={destination} icon={destIcon} title={`${t("destination")}: ${destinationLabel}`}>
        <Popup><strong>{t("destination")}</strong><br />{destinationLabel}</Popup>
      </Marker>
      <Polyline
        positions={[origin, destination]}
        pathOptions={{ color: "#0369a1", weight: 3, dashArray: "6 4", opacity: 0.8 }}
      />
    </MapContainer>
  );
}

export default MapInner;
