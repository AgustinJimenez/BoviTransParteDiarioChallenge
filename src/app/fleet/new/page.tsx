import NewTruckForm from "@/components/domain/NewTruckForm";
import { Truck } from "lucide-react";

export default function NewTruckPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Truck className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Registrar Camión</h1>
            <p className="text-sm text-gray-500">Los datos técnicos del vehículo no podrán editarse una vez registrados.</p>
          </div>
        </div>

        <div className="px-8 py-6">
          <NewTruckForm />
        </div>
      </div>
    </div>
  );
}
