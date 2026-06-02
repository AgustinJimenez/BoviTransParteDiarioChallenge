"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Truck, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/fleet", label: t("fleet"), icon: Truck },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];
  return (
    <header className="sticky top-0 z-40 bg-emerald-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center shadow">
              <Truck className="w-5 h-5 text-emerald-900" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight leading-none">
              Bovi<span className="text-amber-400">Trans</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-emerald-700 text-white"
                    : "text-emerald-100 hover:bg-emerald-800 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
