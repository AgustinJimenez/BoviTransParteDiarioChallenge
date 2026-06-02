"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";

const schema = z.object({
  plate: z.string().min(1, "La patente es requerida").max(20),
  maxCapacity: z.number().int().min(1, "Debe ser al menos 1"),
  fuelConsumption: z.number().min(0.01, "Debe ser mayor a 0").max(10),
});

type FormData = z.infer<typeof schema>;

export default function NewTruckForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch("/api/trucks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error); return; }
    router.push("/fleet");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Patente / Matrícula"
        placeholder="AB-123-CD"
        hint="Se guardará en mayúsculas"
        error={errors.plate?.message}
        {...register("plate")}
      />
      <Input
        label="Capacidad máxima (cabezas de ganado)"
        type="number"
        min={1}
        placeholder="30"
        hint="Cantidad máxima de animales que puede transportar en un viaje"
        error={errors.maxCapacity?.message}
        {...register("maxCapacity", { valueAsNumber: true })}
      />
      <Input
        label="Consumo de combustible (L/km)"
        type="number"
        step="0.01"
        min={0.01}
        placeholder="0.45"
        hint="Litros consumidos por kilómetro recorrido"
        error={errors.fuelConsumption?.message}
        {...register("fuelConsumption", { valueAsNumber: true })}
      />

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          Registrar camión
        </Button>
      </div>
    </form>
  );
}
