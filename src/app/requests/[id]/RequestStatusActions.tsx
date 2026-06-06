"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { RequestStatus } from "@/types";

interface RequestStatusActionsProps {
  requestId: string;
  status: RequestStatus;
}

const RequestStatusActions = ({ requestId, status }: RequestStatusActionsProps) => {
  const t = useTranslations("requestDetail");
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeStatus = async (newStatus: "COMPLETED" | "CANCELLED") => {
    const setLoading = newStatus === "COMPLETED" ? setCompleting : setCancelling;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/transport-requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const busy = completing || cancelling;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("sectionActions")}</p>

      {status === "ASSIGNED" && (
        <Button
          onClick={() => changeStatus("COMPLETED")}
          disabled={busy}
          loading={completing}
          variant="primary"
          className="w-full"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {t("markCompleted")}
        </Button>
      )}

      <Button
        onClick={() => changeStatus("CANCELLED")}
        disabled={busy}
        loading={cancelling}
        variant="secondary"
        className="w-full text-red-600 ring-red-200 hover:bg-red-50"
      >
        <XCircle className="w-4 h-4 mr-2" />
        {t("markCancelled")}
      </Button>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
};

export default RequestStatusActions;
