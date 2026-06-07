"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { formatInternationalPhone } from "@/lib/phoneFormat";
import LocationPickerInline from "@/components/organisms/LocationPickerInline";

const schema = z.object({
  requesterName: z.string().min(1, "El nombre es requerido"),
  requesterPhone: z.string().optional(),
  cattleCount: z.number().int().min(1, "Debe ser al menos 1"),
  origin: z.string().min(1, "El origen es requerido"),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destination: z.string().min(1, "El destino es requerido"),
  destinationLat: z.number().optional(),
  destinationLng: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface RequestModalHeaderProps {
  title: string;
  subtitle: string;
  onClose: () => void;
}

interface RequestModalFormActionsProps {
  onClose: () => void;
  isSubmitting: boolean;
  isValid: boolean;
  cancelLabel: string;
  submitLabel: string;
}

interface NewRequestModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const RequestModalHeader = ({ title, subtitle, onClose }: RequestModalHeaderProps) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
    <div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
      <X className="w-5 h-5" />
    </button>
  </div>
);

const RequestModalFormActions = ({ onClose, isSubmitting, isValid, cancelLabel, submitLabel }: RequestModalFormActionsProps) => (
  <div className="flex gap-3 pt-1">
    <Button type="button" variant="secondary" onClick={onClose} className="flex-1">{cancelLabel}</Button>
    <Button type="submit" loading={isSubmitting} disabled={!isValid} className="flex-1">{submitLabel}</Button>
  </div>
);

const NewRequestModal = ({ onClose, onCreated }: NewRequestModalProps) => {
  const t = useTranslations("newRequest");
  const tPicker = useTranslations("locationPicker");
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const originName = watch("origin");
  const destinationName = watch("destination");
  const originLat = watch("originLat");
  const originLng = watch("originLng");
  const destinationLat = watch("destinationLat");
  const destinationLng = watch("destinationLng");

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const res = await fetch("/api/transport-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error); return; }
    onCreated();
    onClose();
  };

  const originLabel = tPicker("selectOrigin");
  const destinationLabel = tPicker("selectDestination");

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
        <div className="w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh]">
          <RequestModalHeader title={t("title")} subtitle={t("subtitle")} onClose={onClose} />
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4 overflow-y-auto">
            <Input
              label={t("nameLabel")}
              placeholder={t("namePlaceholder")}
              error={errors.requesterName?.message}
              {...register("requesterName")}
            />
            <Controller
              name="requesterPhone"
              control={control}
              render={({ field }) => (
                <Input
                  label={t("phoneLabel")}
                  placeholder={t("phonePlaceholder")}
                  hint={t("phoneHint")}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(formatInternationalPhone(e.target.value))}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />
            <Input
              label={t("cattleLabel")}
              type="number"
              min={1}
              placeholder="30"
              error={errors.cattleCount?.message}
              {...register("cattleCount", { valueAsNumber: true })}
            />
            <LocationPickerInline
              label={originLabel}
              initialLat={originLat}
              initialLng={originLng}
              initialName={originName}
              onChange={(lat, lng, displayName) => {
                setValue("origin", displayName, { shouldValidate: true });
                setValue("originLat", lat);
                setValue("originLng", lng);
              }}
            />
            {errors.origin && <p className="text-xs text-red-600 -mt-3">{errors.origin.message}</p>}
            <LocationPickerInline
              label={destinationLabel}
              initialLat={destinationLat}
              initialLng={destinationLng}
              initialName={destinationName}
              onChange={(lat, lng, displayName) => {
                setValue("destination", displayName, { shouldValidate: true });
                setValue("destinationLat", lat);
                setValue("destinationLng", lng);
              }}
            />
            {errors.destination && <p className="text-xs text-red-600 -mt-3">{errors.destination.message}</p>}
            {serverError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>}
            <RequestModalFormActions
              onClose={onClose}
              isSubmitting={isSubmitting}
              isValid={isValid}
              cancelLabel={t("cancel")}
              submitLabel={t("submit")}
            />
          </form>
        </div>
      </div>
    </>
  );
};

export default NewRequestModal;
