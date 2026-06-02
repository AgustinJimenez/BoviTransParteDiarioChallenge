"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Fuel, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  price: z.number().min(0.01, "El precio debe ser mayor a 0"),
});
type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetch("/api/config/fuel-price")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          reset({ price: d.data.price });
          setUpdatedAt(d.data.updatedAt);
        }
      });
  }, [reset]);

  async function onSubmit(data: FormData) {
    setServerError(null);
    setSaved(false);
    const res = await fetch("/api/config/fuel-price", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error); return; }
    setUpdatedAt(json.data.updatedAt);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
            <Fuel className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
            <p className="text-sm text-gray-500">Parámetros globales de la plataforma.</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="Precio de combustible ($ por litro)"
                type="number"
                step="0.01"
                min={0.01}
                placeholder="1250"
                error={errors.price?.message}
                hint={updatedAt ? `Última actualización: ${new Date(updatedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}` : undefined}
                {...register("price", { valueAsNumber: true })}
              />
            </div>

            {serverError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
            )}

            {saved && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4" />
                Precio actualizado correctamente.
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full">
              Guardar cambios
            </Button>
          </form>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-400 leading-relaxed">
              El precio de combustible se aplica a todos los cálculos de costo de transporte nuevos. Los costos ya calculados en solicitudes existentes no se modifican retroactivamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
