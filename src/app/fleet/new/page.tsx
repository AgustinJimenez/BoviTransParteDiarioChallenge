import { getTranslations } from "next-intl/server";
import { Truck } from "lucide-react";
import NewTruckForm from "@/components/organisms/NewTruckForm";

const NewTruckPage = async () => {
  const t = await getTranslations("fleet");

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Truck className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("newTitle")}</h1>
            <p className="text-sm text-gray-500">{t("newDisclaimer")}</p>
          </div>
        </div>

        <div className="px-8 py-6">
          <NewTruckForm />
        </div>
      </div>
    </div>
  );
}

export default NewTruckPage;
