import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CreditCard, Receipt, CheckCircle2, Clock } from "lucide-react";

interface Pedido {
  id: number;
  estado: string;
  payment_method?: string;
  payment_id?: string;
}

interface PagoCardProps {
  pedido: Pedido;
  procesandoPago: number | null;
  onAprobarPago: (pedidoId: number) => void;
}

export function PagoCard({ pedido, procesandoPago, onAprobarPago }: PagoCardProps) {
  return (
    <Card className="rounded-3xl shadow-md p-8 bg-white border-0 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="flex items-center gap-4 pb-4 border-b-2 border-gray-100 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Información de Pago</h3>
          <p className="text-xs text-gray-500 font-medium">Detalles de transacción</p>
        </div>
      </div>

      <div className="space-y-5">
        {pedido.payment_method ? (
          <>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Método de Pago
                </p>
                <p className="text-base font-bold text-gray-900 uppercase">
                  {pedido.payment_method}
                </p>
              </div>
            </div>

            {pedido.payment_id && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    ID de Transacción
                  </p>
                  <code className="text-xs bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 block font-mono text-gray-900 break-all shadow-sm">
                    {pedido.payment_id}
                  </code>
                </div>
              </div>
            )}

            {pedido.estado === "pendiente_pago" && (
              <Button
                onClick={() => onAprobarPago(pedido.id)}
                disabled={procesandoPago === pedido.id}
                className="w-full bg-gradient-to-r from-[#00897B] to-emerald-600 hover:from-emerald-600 hover:to-[#00897B] text-white font-bold py-6 rounded-2xl shadow-lg text-base mt-6 transition-all duration-300 hover:shadow-xl"
                aria-label="Aprobar pago del pedido"
              >
                {procesandoPago === pedido.id ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Aprobar Pago
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full py-12">
            <div className="text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 italic">
                No hay información de pago disponible
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
