"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Truck as TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import TruckCard from "@/components/domain/TruckCard";
import type { Truck } from "@/types";

export default function FleetPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTrucks() {
    const res = await fetch("/api/trucks");
    const data = await res.json();
    if (data.data) setTrucks(data.data);
    setLoading(false);
  }

  useEffect(() => { loadTrucks(); }, []);

  async function handleToggle(truck: Truck) {
    const res = await fetch(`/api/trucks/${truck.id}`, { method: "PATCH" });
    const data = await res.json();
    if (data.data) {
      setTrucks((prev) => prev.map((t) => t.id === truck.id ? data.data : t));
      startTransition(() => router.refresh());
    }
  }

  const active   = trucks.filter((t) => t.isActive);
  const inactive = trucks.filter((t) => !t.isActive);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración de Flotas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {active.length} camión{active.length !== 1 ? "es" : ""} activo{active.length !== 1 ? "s" : ""}
            {inactive.length > 0 && ` · ${inactive.length} inactivo${inactive.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/fleet/new">
          <Button>
            <Plus className="w-4 h-4" />
            Registrar camión
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trucks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <TruckIcon className="w-12 h-12" />
          <p className="text-lg font-medium">Sin camiones registrados</p>
          <p className="text-sm">Registrá el primer camión de tu flota</p>
          <Link href="/fleet/new">
            <Button className="mt-2"><Plus className="w-4 h-4" /> Registrar camión</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Activos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {active.map((t) => <TruckCard key={t.id} truck={t} onToggle={handleToggle} />)}
              </div>
            </section>
          )}
          {inactive.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Inactivos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inactive.map((t) => <TruckCard key={t.id} truck={t} onToggle={handleToggle} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
