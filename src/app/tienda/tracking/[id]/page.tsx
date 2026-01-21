"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Package, Truck, MapPin, CheckCircle, AlertTriangle } from "lucide-react";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
