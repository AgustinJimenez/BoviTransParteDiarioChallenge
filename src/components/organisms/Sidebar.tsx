"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Truck, LayoutDashboard, Settings, LucideIcon, ChevronLeft, ChevronRight } from "lucide-react";
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
}

interface SidebarCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  expandLabel: string;
  collapseLabel: string;
}

const STORAGE_KEY = "bovitrans-sidebar-collapsed";

const SidebarLogo = ({ isCollapsed }: SidebarLogoProps) => (
  <div className="flex items-center gap-3 px-3 h-16 shrink-0 overflow-hidden">
    <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shadow shrink-0">
      <Truck className="w-4 h-4 text-emerald-900" />
    </div>
    <span className={cn(
      "text-white font-bold text-base tracking-tight leading-none whitespace-nowrap",
      isCollapsed ? "hidden" : "hidden lg:inline"
    )}>
      Bovi<span className="text-amber-400">Trans</span>
    </span>
  </div>
);

const SidebarLinkItem = ({ href, label, icon: Icon, isActive, isCollapsed }: SidebarLinkItemProps) => (
  <Link
    href={href}
    title={label}
    className={cn(
      "flex items-center py-2.5 rounded-lg text-sm font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
      isCollapsed ? "justify-center px-2" : "gap-3 px-3",
      isActive
        ? "bg-emerald-700 text-white"
        : "text-emerald-100 hover:bg-emerald-800 hover:text-white"
    )}
  >
    <Icon className="w-5 h-5 shrink-0" />
    <span className={cn(isCollapsed ? "hidden" : "hidden lg:inline truncate")}>{label}</span>
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

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const links = [
    { href: "/",         label: t("dashboard"), icon: LayoutDashboard },
    { href: "/fleet",    label: t("fleet"),     icon: Truck },
    { href: "/settings", label: t("settings"),  icon: Settings },
  ];

  return (
    <aside className={cn(
      "sticky top-0 h-screen flex flex-col bg-emerald-900 shrink-0 transition-[width] duration-200",
      "w-16",
      !isCollapsed && "lg:w-56"
    )}>
      <SidebarLogo isCollapsed={isCollapsed} />

      <nav className="flex-1 px-2 py-2 space-y-1">
        {links.map(({ href, label, icon }) => (
          <SidebarLinkItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={pathname === href}
            isCollapsed={isCollapsed}
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
  );
}

export default Sidebar;
