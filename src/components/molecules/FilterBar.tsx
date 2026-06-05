"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

interface FilterSearchInputProps {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onClear: () => void;
}

interface FilterStatusChipsProps {
  localStatus: RequestStatus | null;
  hasFilters: boolean;
  onStatusClick: (s: RequestStatus | null) => void;
  onClear: () => void;
  t: ReturnType<typeof useTranslations>;
}

interface FilterBarProps {
  currentStatus: RequestStatus | null;
  currentSearch: string | null;
}

const STATUSES: { value: RequestStatus; key: string }[] = [
  { value: "PENDING",   key: "statusPending" },
  { value: "ASSIGNED",  key: "statusAssigned" },
  { value: "COMPLETED", key: "statusCompleted" },
  { value: "CANCELLED", key: "statusCancelled" },
];

const FilterSearchInput = ({ value, placeholder, onChange, onClear }: FilterSearchInputProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        name="search"
        data-testid="search-input"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400"
      />
      {value && (
        <button onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

const FilterStatusChips = ({ localStatus, hasFilters, onStatusClick, onClear, t }: FilterStatusChipsProps) => {
  const chipClass = (active: boolean) => cn(
    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
    active
      ? "bg-emerald-800 text-white border-emerald-800"
      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 cursor-pointer"
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={() => onStatusClick(null)} className={chipClass(localStatus === null)}>
        {t("all")}
      </button>
      {STATUSES.map(({ value, key }) => (
        <button key={value} onClick={() => onStatusClick(value)} className={chipClass(localStatus === value)}>
          {t(key as "statusPending" | "statusAssigned" | "statusCompleted" | "statusCancelled")}
        </button>
      ))}
      {hasFilters && (
        <button onClick={onClear} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
          <X className="w-3 h-3" />
          {t("clearFilters")}
        </button>
      )}
    </div>
  );
}

const FilterBar = ({ currentStatus, currentSearch }: FilterBarProps) => {
  const t = useTranslations("filterBar");
  const router = useRouter();
  const pathname = usePathname();

  const [localStatus, setLocalStatus] = useState<RequestStatus | null>(currentStatus);
  const [localSearch, setLocalSearch] = useState(currentSearch ?? "");
  const isFirstRender = useRef(true);

  const pushURL = (status: RequestStatus | null, search: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const handleStatusClick = (s: RequestStatus | null) => {
    const next = localStatus === s ? null : s;
    setLocalStatus(next);
    pushURL(next, localSearch);
  }

  const handleClear = () => {
    setLocalStatus(null);
    setLocalSearch("");
    router.push(pathname, { scroll: false });
  }

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => pushURL(localStatus, localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = localStatus !== null || localSearch.trim() !== "";

  return (
    <div className="space-y-3 mb-6">
      <FilterSearchInput
        value={localSearch}
        placeholder={t("searchPlaceholder")}
        onChange={setLocalSearch}
        onClear={() => { setLocalSearch(""); pushURL(localStatus, ""); }}
      />
      <FilterStatusChips
        localStatus={localStatus}
        hasFilters={hasFilters}
        onStatusClick={handleStatusClick}
        onClear={handleClear}
        t={t}
      />
    </div>
  );
}

export default FilterBar;
