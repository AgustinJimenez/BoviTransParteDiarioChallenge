"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { formatArgentinePhone } from "@/lib/phoneFormat";

const schema = z.object({
  requesterName: z.string().min(1, "El nombre es requerido"),
  requesterPhone: z.string().optional(),
  cattleCount: z.number().int().min(1, "Debe ser al menos 1"),
  origin: z.string().min(1, "El origen es requerido"),
  destination: z.string().min(1, "El destino es requerido"),
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
  cancelLabel: string;
  submitLabel: string;
}

interface NewRequestModalProps {
  onClose: () => void;
  onCreated: () => void;
}


const RequestModalHeader = ({ title, subtitle, onClose }: RequestModalHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

const RequestModalFormActions = ({ onClose, isSubmitting, cancelLabel, submitLabel }: RequestModalFormActionsProps) => {
  return (
    <div className="flex gap-3 pt-1">
      <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
        {cancelLabel}
      </Button>
      <Button type="submit" loading={isSubmitting} className="flex-1">
        {submitLabel}
      </Button>
    </div>
  );
}

const NewRequestModal = ({ onClose, onCreated }: NewRequestModalProps) => {
  const t = useTranslations("newRequest");
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <RequestModalHeader title={t("title")} subtitle={t("subtitle")} onClose={onClose} />
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            <Input label={t("nameLabel")} placeholder={t("namePlaceholder")} error={errors.requesterName?.message} {...register("requesterName")} />
            <Controller
              name="requesterPhone"
              control={control}
              render={({ field }) => {
                const PHONE_PREFIX = "+54 9 ";
                const displayValue = (field.value ?? "").startsWith(PHONE_PREFIX)
                  ? (field.value ?? "").slice(PHONE_PREFIX.length)
                  : "";
                return (
                  <Input
                    leftAddon="+54 9"
                    label={t("phoneLabel")}
                    placeholder={t("phonePlaceholder")}
                    hint={t("phoneHint")}
                    value={displayValue}
                    onChange={(e) => {
                      const localDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      field.onChange(localDigits ? formatArgentinePhone(localDigits) : "");
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                );
              }}
            />
            <Input label={t("cattleLabel")} type="number" min={1} placeholder="30" error={errors.cattleCount?.message} {...register("cattleCount", { valueAsNumber: true })} />
            <Input label={t("originLabel")} placeholder={t("originPlaceholder")} error={errors.origin?.message} {...register("origin")} />
            <Input label={t("destinationLabel")} placeholder={t("destinationPlaceholder")} error={errors.destination?.message} {...register("destination")} />
            {serverError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>}
            <RequestModalFormActions onClose={onClose} isSubmitting={isSubmitting} cancelLabel={t("cancel")} submitLabel={t("submit")} />
          </form>
        </div>
      </div>
    </>
  );
}

export default NewRequestModal;
