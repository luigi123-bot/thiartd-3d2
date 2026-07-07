"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Package, Truck, MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import clsx from "clsx";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const getFunnelStep = (estado: string): number => {
  switch (estado) {
    case "pendiente_pago":
    case "pagado":
      return 0; // Pedido Activo
    case "en_preparacion":
      return 1; // Producción
    case "en_envio":
    case "en_transito":
      return 2; // Tránsito
    case "entregado":
      return 3; // Entregado
    default:
      return 0;
  }
};

interface Pedido {
  id: number;
  estado: string;
  total: number;
  created_at: string;
  numero_tracking?: string;
  empresa_envio?: string;
  fecha_estimada_entrega?: string;
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  datos_contacto?: string;
}

interface HistorialItem {
  id: number;
  estado: string;
  descripcion?: string;
  ubicacion?: string;
  fecha: string;
}

interface DatosContacto {
  nombre?: string;
  email?: string;
  telefono?: string;
}

type EstadoConfig = {
  label: string;
  color: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const estadosConfig: Record<string, EstadoConfig> = {
  pendiente_pago: { label: "Pendiente de pago", color: "text-yellow-600", icon: AlertTriangle as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  pagado: { label: "Pagado", color: "text-blue-600", icon: CheckCircle as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  en_preparacion: { label: "En preparación", color: "text-purple-600", icon: Package as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  en_envio: { label: "En envío", color: "text-orange-600", icon: Truck as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  en_transito: { label: "En tránsito", color: "text-orange-600", icon: MapPin as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  entregado: { label: "Entregado", color: "text-green-600", icon: CheckCircle as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  problema_entrega: { label: "Problema entrega", color: "text-red-600", icon: AlertTriangle as React.ComponentType<React.SVGProps<SVGSVGElement>> },
};

export default function TrackingPage() {
  const params = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const pedidoId = params.id;
        
        // Obtener datos del pedido
        const { data: pedidoData, error: pedidoError } = await supabase
          .from("pedidos")
          .select("*")
          .eq("id", pedidoId)
          .single<Pedido>();

        if (pedidoError ?? !pedidoData) {
          setError("Pedido no encontrado");
          return;
        }

        setPedido(pedidoData);

        // Obtener historial de tracking
        const { data: historialData } = await supabase
          .from("historial_envios")
          .select("*")
          .eq("pedido_id", pedidoId)
          .order("fecha", { ascending: false });

        setHistorial(historialData ?? []);

      } catch (err) {
        console.error("Error cargando tracking:", err);
        setError("Error cargando información del pedido");
      } finally {
        setLoading(false);
      }
    };

    void fetchPedido();
  }, [params.id]);

  const getEstadoInfo = (estado: string) => {
    return (estadosConfig[estado] ?? estadosConfig.pendiente_pago)!;
  };

  const parseDatosContacto = (datosContacto?: string): DatosContacto => {
    if (!datosContacto) return {};
    try {
      return JSON.parse(datosContacto) as DatosContacto;
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 text-sm sm:text-base">Cargando información del pedido...</div>
        </div>
      </div>
    );
  }

  if (error ?? !pedido) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-4 sm:p-6 md:p-8 text-center overflow-hidden">
            <AlertTriangle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-red-500 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Error</h2>
            <p className="text-sm sm:text-base text-gray-600">{error ?? "Pedido no encontrado"}</p>
          </Card>
        </div>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo(pedido.estado);
  const IconComponent = estadoInfo.icon;
  const contacto = parseDatosContacto(pedido.datos_contacto);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">Seguimiento de Pedido</h1>
        
        {/* Información del pedido */}
        <Card className="p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4">Información del Pedido</h2>
              <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                <div><strong>Número:</strong> #{pedido.id}</div>
                <div><strong>Fecha:</strong> {new Date(pedido.created_at).toLocaleDateString()}</div>
                <div><strong>Total:</strong> ${Number(pedido.total).toFixed(0)}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <strong>Estado:</strong>
                  <span className={`flex items-center gap-1 ${estadoInfo.color}`}>
                    <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm md:text-base">{estadoInfo.label}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4">Información de Envío</h2>
              <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                {pedido.numero_tracking && (
                  <div><strong>Número de tracking:</strong> <span className="break-all">{pedido.numero_tracking}</span></div>
                )}
                {pedido.empresa_envio && (
                  <div><strong>Empresa:</strong> {pedido.empresa_envio}</div>
                )}
                {pedido.fecha_estimada_entrega && (
                  <div>
                    <strong>Fecha estimada:</strong> {new Date(pedido.fecha_estimada_entrega).toLocaleDateString()}
                  </div>
                )}
                {pedido.direccion_envio && (
                  <div>
                    <strong>Dirección:</strong> {pedido.direccion_envio}
                    {pedido.ciudad_envio && `, ${pedido.ciudad_envio}`}
                    {pedido.departamento_envio && `, ${pedido.departamento_envio}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Rediseño de Seguimiento en Funnel de 4 Etapas */}
        <Card className="p-6 md:p-8 mb-6 overflow-hidden bg-white border border-slate-100 shadow-md rounded-[2rem]">
          <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-6 uppercase tracking-tight text-center md:text-left">
            Estado de tu <span className="text-[#00a19a]">Pedido</span>
          </h2>
          
          <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-4 pt-4">
            {/* Línea de progreso de fondo (Desktop) */}
            <div className="hidden md:block absolute left-8 right-8 top-[36px] h-1.5 bg-slate-100 -z-10 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-[#00a19a] to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${(getFunnelStep(pedido.estado) / 3) * 100}%` }}
              />
            </div>

            {([
              { label: "Pedido Activo", desc: "Registrado e inicializado", icon: CheckCircle },
              { label: "Producción", desc: "Modelando e imprimiendo 3D", icon: Package },
              { label: "Tránsito", desc: "Guía de envío generada", icon: Truck },
              { label: "Entregado", desc: "Entregado con éxito", icon: MapPin }
            ] as { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[]).map((step, idx) => {
              const currentStep = getFunnelStep(pedido.estado);
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;
              const isPending = idx > currentStep;
              const StepIcon = step.icon;

              return (
                <div key={idx} className="flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1 text-left md:text-center relative">
                  {/* Conector de línea de progreso para móvil */}
                  {idx > 0 && (
                    <div className="md:hidden absolute left-7 -top-6 bottom-10 w-1 bg-slate-100 -z-10">
                      <div 
                        className="w-full bg-[#00a19a] transition-all duration-1000"
                        style={{ height: idx <= currentStep ? "100%" : "0%" }}
                      />
                    </div>
                  )}

                  {/* Círculo indicador de etapa */}
                  <div 
                    className={clsx(
                      "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-md shrink-0",
                      isCompleted && "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200",
                      isActive && "bg-white border-[#00a19a] text-[#00a19a] ring-4 ring-teal-50 scale-110",
                      isPending && "bg-slate-50 border-slate-200 text-slate-400"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 stroke-[3]" />
                    ) : (
                      <StepIcon className={clsx("w-6 h-6", isActive && "animate-pulse")} />
                    )}
                  </div>

                  {/* Detalles textuales */}
                  <div className="flex flex-col">
                    <span 
                      className={clsx(
                        "text-xs md:text-sm font-black uppercase tracking-wider",
                        (isActive || isCompleted) ? "text-slate-800" : "text-slate-400"
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 leading-snug">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Historial de tracking */}
        <Card className="p-4 sm:p-5 md:p-6 overflow-hidden">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-5 md:mb-6">Historial de Envío</h2>
          
          {historial.length === 0 ? (
            <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
              No hay historial de seguimiento disponible
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {historial.map((item, index) => {
                const itemEstadoInfo = getEstadoInfo(item.estado);
                const ItemIconComponent = itemEstadoInfo.icon;
                
                return (
                  <div key={item.id} className="flex gap-3 sm:gap-4">
                    <div className="flex flex-col items-center">
                      <div className="p-2 sm:p-3 rounded-full bg-gray-100">
                        <ItemIconComponent className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${itemEstadoInfo.color}`} />
                      </div>
                      {index < historial.length - 1 && (
                        <div className="w-px h-10 sm:h-12 bg-gray-300 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6 sm:pb-8">
                      <div className="font-semibold text-sm sm:text-base md:text-lg">{itemEstadoInfo.label}</div>
                      {item.descripcion && (
                        <div className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base">{item.descripcion}</div>
                      )}
                      {item.ubicacion && (
                        <div className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                          {item.ubicacion}
                        </div>
                      )}
                      <div className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">
                        {new Date(item.fecha).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Información de contacto */}
        {(contacto.nombre ?? contacto.email ?? contacto.telefono) && (
          <Card className="p-4 sm:p-5 md:p-6 mt-4 sm:mt-5 md:mt-6 overflow-hidden">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4">Información de Contacto</h2>
            <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base">
              {contacto.nombre && <div><strong>Nombre:</strong> {contacto.nombre}</div>}
              {contacto.email && <div><strong>Email:</strong> <span className="break-all">{contacto.email}</span></div>}
              {contacto.telefono && <div><strong>Teléfono:</strong> {contacto.telefono}</div>}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
