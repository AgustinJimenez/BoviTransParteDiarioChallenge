"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { searchLocations, reverseGeocode } from "@/lib/geocoding";
import type { LocationSuggestion } from "@/lib/geocoding";
import { cn } from "@/lib/utils";

interface LocationPickerInlineProps {
  label: string;
  initialLat?: number;
  initialLng?: number;
  initialName?: string;
  onChange: (lat: number, lng: number, displayName: string) => void;
}

interface InlineSuggestionsProps {
  suggestions: LocationSuggestion[];
  isSearching: boolean;
  searchingLabel: string;
  onSelect: (s: LocationSuggestion) => void;
}

const DEFAULT_LAT = -25.2867;
const DEFAULT_LNG = -57.6478;

const LocationPickerInner = dynamic(
  () => import("@/components/organisms/LocationPickerInner"),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" /> }
);

const InlineSuggestions = ({ suggestions, isSearching, searchingLabel, onSelect }: InlineSuggestionsProps) => {
  if (isSearching) return (
    <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl bg-white">
      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      <span>{searchingLabel}</span>
    </div>
  );
  if (!suggestions.length) return null;
  return (
    <ul className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white max-h-40 overflow-y-auto">
      {suggestions.map((s, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => onSelect(s)}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-emerald-50 flex items-start gap-2"
          >
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{s.displayName}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};

const LocationPickerInline = ({ label, initialLat, initialLng, initialName, onChange }: LocationPickerInlineProps) => {
  const t = useTranslations("locationPicker");

  const [lat, setLat] = useState(initialLat ?? DEFAULT_LAT);
  const [lng, setLng] = useState(initialLng ?? DEFAULT_LNG);
  const [query, setQuery] = useState(initialName ?? "");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [flyVersion, setFlyVersion] = useState(0);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reverseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    clearTimeout(searchTimer.current);
    if (!value.trim()) { setSuggestions([]); setIsSearching(false); return; }
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchLocations(value);
      setSuggestions(results);
      setIsSearching(false);
    }, 500);
  };

  const handleSelectSuggestion = (s: LocationSuggestion) => {
    setLat(s.lat);
    setLng(s.lng);
    setQuery(s.displayName);
    setSuggestions([]);
    setShowSuggestions(false);
    setFlyVersion(v => v + 1);
    onChange(s.lat, s.lng, s.displayName);
  };

  const handlePositionChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setSuggestions([]);
    setShowSuggestions(false);
    clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(async () => {
      const name = await reverseGeocode(newLat, newLng);
      const resolved = name ?? `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`;
      setQuery(resolved);
      onChange(newLat, newLng, resolved);
    }, 600);
  }, [onChange]);

  useEffect(() => () => {
    clearTimeout(searchTimer.current);
    clearTimeout(reverseTimer.current);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={t("searchPlaceholder")}
          className={cn(
            "w-full rounded-xl border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm text-gray-900",
            "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
            query && "border-emerald-400"
          )}
        />
      </div>

      {showSuggestions && (
        <InlineSuggestions
          suggestions={suggestions}
          isSearching={isSearching}
          searchingLabel={t("searching")}
          onSelect={handleSelectSuggestion}
        />
      )}

      <div className="h-52 rounded-xl overflow-hidden border border-gray-200">
        <LocationPickerInner
          lat={lat}
          lng={lng}
          flyVersion={flyVersion}
          markerTitle={t("markerTitle")}
          onPositionChange={handlePositionChange}
        />
      </div>

      <p className="text-xs text-gray-400 text-center">{t("dragHint")}</p>
    </div>
  );
};

export default LocationPickerInline;
