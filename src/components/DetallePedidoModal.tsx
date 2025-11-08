"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { 
  Receipt, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Maximize2, 
  Minimize2,
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  Building2,
  MapIcon,
  Mail as MailIcon,
  CreditCard,
  Package,
  Printer,
  Download
} from "lucide-react";
import { parseJSON, getEstadoBadgeClass } from "../app/admin/pedidos/utils";

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

// ============================================
// COMPONENTES INTERNOS
// ============================================

// Componente de Item reutilizable para información
function InfoItem({ 
  label, 
  value, 
  icon, 
  bg 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  bg: string; 
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}

// Header del pedido
function PedidoHeader({ 
  pedido, 
  modalSize, 
  onToggleSize, 
  onClose 
}: { 
  pedido: Pedido; 
  modalSize: "normal" | "expanded" | "full"; 
  onToggleSize: () => void; 
  onClose: () => void; 
}) {
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
            <span className={`px-6 py-2.5 rounded-full text-sm font-bold border-2 shadow-lg ${estadoBadgeClass}`}>
              {pedido.estado.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 border-2 border-white/30">
            <p className="text-xs text-white/90 font-semibold mb-1 uppercase tracking-wider">
              Total
            </p>
            <p className="text-4xl font-bold text-white tracking-tight">
              ${Number(pedido.total).toLocaleString("es-CO")}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSize}
            className="text-white hover:text-white bg-white/30 hover:bg-white/40 rounded-xl h-12 w-12 transition-all shadow-md border-2 border-white/50"
          >
            {modalSize === 'full' ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:text-white bg-white/30 hover:bg-white/40 rounded-xl h-12 w-12 transition-all shadow-md border-2 border-white/50"
          >
            <span className="text-3xl font-light">×</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Card de información del cliente
function ClienteCard({ 
  pedido, 
  datos 
}: { 
  pedido: Pedido; 
  datos: DatosContacto; 
}) {
  return (
    <Card className="rounded-3xl shadow-md p-8 bg-white border-0 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="flex items-center gap-4 pb-4 border-b-2 border-gray-100 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-[#00897B] to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Cliente</h3>
          <p className="text-xs text-gray-500 font-medium">Información de contacto</p>
        </div>
      </div>

      <div className="space-y-5">
        <InfoItem 
          label="Nombre completo" 
          value={datos.nombre ?? "No especificado"} 
          icon={<User className="w-5 h-5 text-blue-600" />} 
          bg="bg-blue-50" 
        />
        <InfoItem 
          label="Correo electrónico" 
          value={datos.email ?? "No especificado"} 
          icon={<Mail className="w-5 h-5 text-green-600" />} 
          bg="bg-green-50" 
        />
        <InfoItem 
          label="Teléfono" 
          value={pedido.telefono_envio ?? "No especificado"} 
          icon={<Phone className="w-5 h-5 text-purple-600" />} 
          bg="bg-purple-50" 
        />
      </div>
    </Card>
  );
}

// Card de dirección de envío
function DireccionCard({ pedido }: { pedido: Pedido }) {
  const direccionCompleta = [
    pedido.direccion_envio,
    pedido.ciudad_envio,
    pedido.departamento_envio,
    "Colombia",
  ].filter(Boolean).join(", ");

  const mapUrl = direccionCompleta
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(direccionCompleta)}`
    : null;

  return (
    <Card className="rounded-3xl shadow-md p-8 bg-white border-0 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="flex items-center gap-4 pb-4 border-b-2 border-gray-100 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Dirección de Envío</h3>
          <p className="text-xs text-gray-500 font-medium">Ubicación de entrega</p>
        </div>
      </div>

      <div className="space-y-5">
        <InfoItem 
          label="Dirección" 
          value={pedido.direccion_envio ?? "No especificada"} 
          icon={<Home className="w-5 h-5 text-orange-600" />} 
          bg="bg-orange-50" 
        />

        <div className="grid grid-cols-2 gap-4">
          <InfoItem 
            label="Ciudad" 
            value={pedido.ciudad_envio ?? "-"} 
            icon={<Building2 className="w-5 h-5 text-teal-600" />} 
            bg="bg-teal-50" 
          />
          <InfoItem 
            label="Departamento" 
            value={pedido.departamento_envio ?? "-"} 
            icon={<MapIcon className="w-5 h-5 text-indigo-600" />} 
            bg="bg-indigo-50" 
          />
        </div>

        {pedido.codigo_postal_envio && (
          <InfoItem 
            label="Código Postal" 
            value={pedido.codigo_postal_envio} 
            icon={<MailIcon className="w-5 h-5 text-pink-600" />} 
            bg="bg-pink-50" 
          />
        )}

        {pedido.notas_envio && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-2">
              <span>📝</span> Notas especiales
            </p>
            <p className="text-sm text-amber-900 leading-relaxed">{pedido.notas_envio}</p>
          </div>
        )}

        {mapUrl && (
          <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg mt-4">
            <iframe
              title={`Ubicación: ${direccionCompleta}`}
              width="100%"
              height="220"
              className="border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={mapUrl}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

// Card de información de pago
function PagoCard({ 
  pedido, 
  procesandoPago, 
  onAprobarPago 
}: { 
  pedido: Pedido; 
  procesandoPago: number | null; 
  onAprobarPago: (pedidoId: number) => void; 
}) {
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

// Card de productos del pedido
function ProductosCard({ productos }: { productos: Producto[] }) {
  return (
    <div className="lg:col-span-2">
      <Card className="rounded-3xl shadow-md p-8 bg-white border-0 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <div className="flex items-center gap-4 pb-4 border-b-2 border-gray-100 mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Productos del Pedido</h3>
            <p className="text-xs text-gray-500 font-medium">
              {productos.length} artículo{productos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scroll-smooth">
          {productos.map((prod, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-gray-50 to-purple-50 border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:border-purple-200"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-gray-900 text-base flex-1 leading-tight pr-4">
                  {prod.titulo ?? prod.nombre ?? prod.producto_id}
                </h4>
                <span className="bg-gradient-to-r from-[#00897B] to-emerald-600 text-white text-sm px-4 py-2 rounded-full font-bold shadow-md whitespace-nowrap">
                  ×{prod.cantidad}
                </span>
              </div>

              {prod.descripcion && (
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {prod.descripcion}
                </p>
              )}

              <div className="border-t-2 border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Precio unitario</span>
                  <span className="font-bold text-gray-900">
                    ${Number(prod.precio_unitario).toLocaleString("es-CO")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Subtotal</span>
                  <span className="font-extrabold text-[#00897B] text-lg">
                    ${(prod.cantidad * prod.precio_unitario).toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Card de resumen del pedido
function ResumenCard({ pedido }: { pedido: Pedido }) {
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

        <div className="bg-gradient-to-r from-[#00897B] to-emerald-600 rounded-3xl p-6 shadow-2xl mt-6 relative overflow-hidden">
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
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </Card>
  );
}

// Footer del modal con acciones
function PedidoFooter({ pedido }: { pedido: Pedido }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert("Función de descarga en desarrollo");
  };

  return (
    <div className="flex-shrink-0 bg-white border-t-2 border-gray-100 px-12 py-5 shadow-lg">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 font-medium">
            Pedido generado el{" "}
            {new Date(pedido.created_at).toLocaleDateString("es-ES")}
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-2 border-gray-300 hover:border-[#00897B] hover:bg-emerald-50 text-gray-700 font-semibold px-6 py-5 rounded-2xl transition-all duration-300"
            >
              <Printer className="w-5 h-5 mr-2" />
              Imprimir
            </Button>
            
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-[#00897B] to-emerald-600 hover:from-emerald-600 hover:to-[#00897B] text-white font-bold px-6 py-5 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <Download className="w-5 h-5 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

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
