"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { PedidoHeader } from "./PedidoHeader";
import { ClienteCard } from "./ClienteCard";
import { DireccionCard } from "./DireccionCard";
import { PagoCard } from "./PagoCard";
import { ProductosCard } from "./ProductosCard";
import { ResumenCard } from "./ResumenCard";
import { PedidoFooter } from "./PedidoFooter";
import { parseJSON } from "./utils";

interface Producto {
  id: string;
  titulo?: string;
  nombre?: string;
  producto_id?: string;
  cantidad: number;
  precio_unitario: number;
  descripcion?: string;
}

interface DatosContacto {
  nombre?: string;
  email?: string;
}

interface Pedido {
  id: number;
  cliente_id: string;
  estado: string;
  created_at: string;
  total: number;
  subtotal?: number;
  costo_envio?: number;
  productos: string | Producto[];
  datos_contacto?: string | DatosContacto;
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  codigo_postal_envio?: string;
  telefono_envio?: string;
  notas_envio?: string;
  payment_id?: string;
  payment_method?: string;
}

interface DetallePedidoModalProps {
  pedido: Pedido | null;
  onClose: () => void;
  onAprobarPago: (pedidoId: number) => void;
  procesandoPago: number | null;
}

export function DetallePedidoModal({
  pedido,
  onClose,
  onAprobarPago,
  procesandoPago,
}: DetallePedidoModalProps) {
  const [modalSize, setModalSize] = useState<"normal" | "expanded" | "full">("expanded");
  
  if (!pedido) return null;

  const datos = parseJSON<DatosContacto>(pedido.datos_contacto) ?? {};
  const productos = parseJSON<Producto[]>(pedido.productos) ?? [];

  const toggleSize = () => {
    setModalSize((s) => (s === "normal" ? "expanded" : s === "expanded" ? "full" : "normal"));
  };

  const modalSizeClasses = {
    normal: "w-[85vw] h-[85vh]",
    expanded: "w-[98vw] h-[98vh]",
    full: "w-screen h-screen",
  };

  return (
    <Dialog open={!!pedido} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={`max-w-none ${modalSizeClasses[modalSize]} p-0 gap-0 overflow-hidden border-0 shadow-2xl transition-all duration-300`}
        aria-label="Detalle del pedido"
      >
        <div className="h-full flex flex-col overflow-hidden bg-[#F8F9FA]">
          <PedidoHeader 
            pedido={pedido} 
            modalSize={modalSize} 
            onToggleSize={toggleSize} 
            onClose={onClose} 
          />

          <div className="flex-1 overflow-y-auto px-12 py-8 scroll-smooth">
            <div className="max-w-[1920px] mx-auto space-y-8">
              {/* Información general */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ClienteCard pedido={pedido} datos={datos} />
                <DireccionCard pedido={pedido} />
                <PagoCard 
                  pedido={pedido} 
                  procesandoPago={procesandoPago} 
                  onAprobarPago={onAprobarPago} 
                />
              </div>

              {/* Productos y resumen */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ProductosCard productos={productos} />
                <ResumenCard pedido={pedido} />
              </div>
            </div>
          </div>

          <PedidoFooter pedido={pedido} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
