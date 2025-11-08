import { Button } from "~/components/ui/button";
import { Receipt, CheckCircle2, Clock, XCircle, Maximize2, Minimize2 } from "lucide-react";
import { getEstadoBadgeClass } from "./utils";

interface Pedido {
  id: number;
  estado: string;
  created_at: string;
  total: number;
}

interface PedidoHeaderProps {
  pedido: Pedido;
  modalSize: "normal" | "expanded" | "full";
  onToggleSize: () => void;
  onClose: () => void;
}

export function PedidoHeader({ pedido, modalSize, onToggleSize, onClose }: PedidoHeaderProps) {
  const estadoBadgeClass = getEstadoBadgeClass(pedido.estado);

  return (
    <div className="flex-shrink-0 bg-gradient-to-r from-[#00897B] to-emerald-600 px-12 py-6 shadow-lg relative">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        <div className="flex items-center gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
              Pedido #{pedido.id}
            </h1>
            <p className="text-sm text-white/90 font-medium">
              {new Date(pedido.created_at).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Badge de estado con animación */}
          <div className="flex items-center gap-3">
            {pedido.estado === "pagado" && (
              <CheckCircle2 className="w-6 h-6 text-white animate-pulse" />
            )}
            {pedido.estado === "pendiente_pago" && (
              <Clock className="w-6 h-6 text-white animate-spin" style={{ animationDuration: "3s" }} />
            )}
            {(pedido.estado === "pago_rechazado" || pedido.estado === "pago_cancelado") && (
              <XCircle className="w-6 h-6 text-white" />
            )}
            <span
              className={`px-6 py-2.5 rounded-full text-sm font-bold border-2 shadow-lg ${estadoBadgeClass}`}
            >
              {pedido.estado.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          {/* Total destacado */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 border-2 border-white/30">
            <p className="text-xs text-white/90 font-semibold mb-1 uppercase tracking-wider">
              Total
            </p>
            <p className="text-4xl font-bold text-white tracking-tight">
              ${Number(pedido.total).toLocaleString("es-CO")}
            </p>
          </div>

          {/* Botón para ajustar tamaño */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSize}
            className="text-white hover:text-white bg-white/30 hover:bg-white/40 rounded-xl h-12 w-12 transition-all shadow-md border-2 border-white/50"
            aria-label={`Cambiar tamaño del modal a ${modalSize === 'normal' ? 'expandido' : modalSize === 'expanded' ? 'pantalla completa' : 'normal'}`}
            title={`Tamaño: ${modalSize === 'normal' ? 'Normal (85%)' : modalSize === 'expanded' ? 'Expandido (98%)' : 'Pantalla completa'}`}
          >
            {modalSize === 'full' ? (
              <Minimize2 className="w-6 h-6" />
            ) : (
              <Maximize2 className="w-6 h-6" />
            )}
          </Button>

          {/* Botón de cierre */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:text-white bg-white/30 hover:bg-white/40 rounded-xl h-12 w-12 transition-all shadow-md border-2 border-white/50"
            aria-label="Cerrar modal"
          >
            <span className="text-3xl font-light">×</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
