"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Truck, LayoutDashboard, Settings, LucideIcon, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLogoProps {
  isCollapsed: boolean;
}

interface SidebarLinkItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate: () => void;
}

interface SidebarCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  expandLabel: string;
  collapseLabel: string;
}

const STORAGE_KEY = "bovitrans-sidebar-collapsed";

const SidebarLogo = ({ isCollapsed }: SidebarLogoProps) => (
  <div className="hidden lg:flex items-center gap-3 px-3 h-16 shrink-0 overflow-hidden">
    <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shadow shrink-0">
      <Truck className="w-4 h-4 text-emerald-900" />
    </div>
    <span className={cn(
      "text-white font-bold text-base tracking-tight leading-none whitespace-nowrap",
      isCollapsed && "lg:hidden"
    )}>
      Bovi<span className="text-amber-400">Trans</span>
    </span>
  </div>
);

const SidebarLinkItem = ({ href, label, icon: Icon, isActive, isCollapsed, onNavigate }: SidebarLinkItemProps) => (
  <Link
    href={href}
    title={label}
    onClick={onNavigate}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
      isCollapsed && "lg:justify-center lg:px-2",
      isActive
        ? "bg-emerald-700 text-white"
        : "text-emerald-100 hover:bg-emerald-800 hover:text-white"
    )}
  >
    <Icon className="w-5 h-5 shrink-0" />
    <span className={cn("truncate", isCollapsed && "lg:hidden")}>{label}</span>
  </Link>
);

const SidebarCollapseButton = ({ isCollapsed, onToggle, expandLabel, collapseLabel }: SidebarCollapseButtonProps) => (
  <div className="hidden lg:block px-2 pb-4">
    <button
      onClick={onToggle}
      title={isCollapsed ? expandLabel : collapseLabel}
      className="w-full flex items-center justify-center p-2 rounded-lg text-emerald-400 hover:bg-emerald-800 hover:text-white transition-colors cursor-pointer"
    >
      {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
    </button>
  </div>
);

const Sidebar = () => {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === "true" : true;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const closeMobile = () => setIsMobileOpen(false);

  const links = [
    { href: "/",         label: t("dashboard"), icon: LayoutDashboard },
    { href: "/fleet",    label: t("fleet"),     icon: Truck },
    { href: "/settings", label: t("settings"),  icon: Settings },
  ];

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-14 z-40 bg-emerald-900 flex items-center justify-between px-4 shadow-md">
        <span className="text-white font-bold text-lg tracking-tight leading-none">
          Bovi<span className="text-amber-400">Trans</span>
        </span>
        <button
          onClick={() => setIsMobileOpen(true)}
          aria-label={t("openMenu")}
          className="p-1.5 rounded-lg text-emerald-100 hover:bg-emerald-800 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ───────────────────────────────────────────────── */}
      <aside className={cn(
        "fixed lg:sticky top-0 h-screen z-50 flex flex-col bg-emerald-900 shrink-0",
        "transition-transform lg:transition-[width] duration-200",
        // Mobile: slide in/out from left
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
        // Mobile sidebar is always full-width with labels
        "w-64",
        // Desktop: respects collapse state
        isCollapsed ? "lg:w-16" : "lg:w-56"
      )}>
        {/* Desktop logo */}
        <SidebarLogo isCollapsed={isCollapsed} />

        {/* Mobile header inside drawer */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 shrink-0 border-b border-emerald-800">
          <span className="text-white font-bold text-lg tracking-tight leading-none">
            Bovi<span className="text-amber-400">Trans</span>
          </span>
          <button
            onClick={closeMobile}
            aria-label={t("closeMenu")}
            className="p-1.5 rounded-lg text-emerald-100 hover:bg-emerald-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map(({ href, label, icon }) => (
            <SidebarLinkItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              isActive={pathname === href}
              isCollapsed={isCollapsed}
              onNavigate={closeMobile}
            />
          ))}
        </nav>

        <SidebarCollapseButton
          isCollapsed={isCollapsed}
          onToggle={toggleCollapse}
          expandLabel={t("expand")}
          collapseLabel={t("collapse")}
        />
      </aside>
    </>
  );
}

export default Sidebar;
