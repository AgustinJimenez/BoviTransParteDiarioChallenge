import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

interface StatusBadgeProps {
  status: RequestStatus;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gray" | "green" | "amber" | "sky";
  className?: string;
}

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  PENDING:   { label: "Pendiente",  className: "bg-amber-100 text-amber-800 ring-amber-200" },
  ASSIGNED:  { label: "Asignado",   className: "bg-sky-100 text-sky-800 ring-sky-200" },
  COMPLETED: { label: "Completado", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  CANCELLED: { label: "Cancelado",  className: "bg-gray-100 text-gray-600 ring-gray-200" },
};

// Gray badge uses bg-white so that even axe-core's P3→sRGB misconversion
// of the text color gives ≥ 4.5:1 on the pure-white background.
const variantMap = {
  gray:  "bg-white text-gray-900 ring-1 ring-gray-300",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  sky:   "bg-sky-100 text-sky-800",
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { label, className } = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset", className)}>
      {label}
    </span>
  );
}

export const Badge = ({ children, variant = "gray", className }: BadgeProps) => {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", variantMap[variant], className)}>
      {children}
    </span>
  );
}
