import { Card } from "~/components/ui/card";
import { Receipt } from "lucide-react";

interface Pedido {
  total: number;
  subtotal?: number;
  costo_envio?: number;
}

interface ResumenCardProps {
  pedido: Pedido;
}

export function ResumenCard({ pedido }: ResumenCardProps) {
  return (
    <Card className="rounded-3xl shadow-md p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-0 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="flex items-center gap-4 pb-4 border-b-2 border-emerald-200 mb-6 overflow-hidden">
        <div className="w-12 h-12 bg-gradient-to-br from-[#00897B] to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Receipt className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Resumen</h3>
          <p className="text-xs text-gray-600 font-medium">Desglose de costos</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex justify-between items-center py-3 border-b border-emerald-200">
          <span className="text-base font-semibold text-gray-700">Subtotal</span>
          <span className="text-xl font-bold text-gray-900">
            ${Number(pedido.subtotal ?? pedido.total).toLocaleString("es-CO")}
          </span>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-emerald-200">
          <span className="text-base font-semibold text-gray-700">Envío</span>
          <span className="text-xl font-bold text-gray-900">
            ${Number(pedido.costo_envio ?? 0).toLocaleString("es-CO")}
          </span>
        </div>

        {/* Total destacado con efecto */}
        <div className="bg-gradient-to-r from-[#00897B] to-emerald-600 rounded-3xl p-6 shadow-2xl mt-6 relative overflow-hidden">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          
          <div className="relative">
            <p className="text-sm font-bold text-white/90 uppercase tracking-wider mb-2 text-center">
              Total del Pedido
            </p>
            <p className="text-5xl font-bold text-white text-center tracking-tight">
              ${Number(pedido.total).toLocaleString("es-CO")}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </Card>
  );
}
