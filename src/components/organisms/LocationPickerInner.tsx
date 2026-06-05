"use client";

import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerInnerProps {
  lat: number;
  lng: number;
  flyVersion: number;
  markerTitle: string;
  onPositionChange: (lat: number, lng: number) => void;
}

interface DraggableMarkerProps {
  lat: number;
  lng: number;
  markerTitle: string;
  onPositionChange: (lat: number, lng: number) => void;
}

interface MapFlyProps {
  lat: number;
  lng: number;
  flyVersion: number;
}

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
}

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="#16a34a"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

const DraggableMarker = ({ lat, lng, markerTitle, onPositionChange }: DraggableMarkerProps) => {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(() => ({
    dragend: () => {
      const m = markerRef.current;
      if (m) { const pos = m.getLatLng(); onPositionChange(pos.lat, pos.lng); }
    },
  }), [onPositionChange]);
  return (
    <Marker
      draggable
      ref={markerRef}
      position={[lat, lng]}
      icon={pinIcon}
      eventHandlers={eventHandlers}
      title={markerTitle}
    />
  );
}

const MapFly = ({ lat, lng, flyVersion }: MapFlyProps) => {
  const map = useMap();
  const prevVersion = useRef(0);
  useEffect(() => {
    if (flyVersion !== prevVersion.current) {
      prevVersion.current = flyVersion;
      map.flyTo([lat, lng], 14, { duration: 0.8 });
    }
  }, [map, lat, lng, flyVersion]);
  return null;
}

const MapClickHandler = ({ onClick }: MapClickHandlerProps) => {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

const LocationPickerInner = ({ lat, lng, flyVersion, markerTitle, onPositionChange }: LocationPickerInnerProps) => (
  <MapContainer
    center={[lat, lng]}
    zoom={13}
    style={{ height: "100%", width: "100%" }}
    zoomControl
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <DraggableMarker lat={lat} lng={lng} markerTitle={markerTitle} onPositionChange={onPositionChange} />
    <MapClickHandler onClick={onPositionChange} />
    <MapFly lat={lat} lng={lng} flyVersion={flyVersion} />
  </MapContainer>
);

export default LocationPickerInner;
