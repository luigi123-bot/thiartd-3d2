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

const estadosConfig = {
  pendiente_pago: { label: "Pendiente de pago", color: "text-yellow-600", icon: AlertTriangle },
  pagado: { label: "Pagado", color: "text-blue-600", icon: CheckCircle },
  en_preparacion: { label: "En preparación", color: "text-purple-600", icon: Package },
  en_envio: { label: "En envío", color: "text-orange-600", icon: Truck },
  en_transito: { label: "En tránsito", color: "text-orange-600", icon: MapPin },
  entregado: { label: "Entregado", color: "text-green-600", icon: CheckCircle },
  problema_entrega: { label: "Problema entrega", color: "text-red-600", icon: AlertTriangle },
};

export default function TrackingPage() {
  const params = useParams();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const pedidoId = params.id as string;
        
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
    return estadosConfig[estado as keyof typeof estadosConfig] ?? estadosConfig.pendiente_pago;
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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Cargando información del pedido...</div>
        </div>
      </div>
    );
  }

  if (error ?? !pedido) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600">{error ?? "Pedido no encontrado"}</p>
          </Card>
        </div>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo(pedido.estado);
  const IconComponent = estadoInfo.icon;
  const contacto = parseDatosContacto(pedido.datos_contacto);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Seguimiento de Pedido</h1>
        
        {/* Información del pedido */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Información del Pedido</h2>
              <div className="space-y-2">
                <div><strong>Número:</strong> #{pedido.id}</div>
                <div><strong>Fecha:</strong> {new Date(pedido.created_at).toLocaleDateString()}</div>
                <div><strong>Total:</strong> ${Number(pedido.total).toFixed(0)}</div>
                <div className="flex items-center gap-2">
                  <strong>Estado:</strong>
                  <span className={`flex items-center gap-1 ${estadoInfo.color}`}>
                    <IconComponent className="w-4 h-4" />
                    {estadoInfo.label}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Información de Envío</h2>
              <div className="space-y-2">
                {pedido.numero_tracking && (
                  <div><strong>Número de tracking:</strong> {pedido.numero_tracking}</div>
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
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Historial de Envío</h2>
          
          {historial.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay historial de seguimiento disponible
            </div>
          ) : (
            <div className="space-y-4">
              {historial.map((item, index) => {
                const itemEstadoInfo = getEstadoInfo(item.estado);
                const ItemIconComponent = itemEstadoInfo.icon;
                
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-full bg-gray-100">
                        <ItemIconComponent className={`w-6 h-6 ${itemEstadoInfo.color}`} />
                      </div>
                      {index < historial.length - 1 && (
                        <div className="w-px h-12 bg-gray-300 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="font-semibold text-lg">{itemEstadoInfo.label}</div>
                      {item.descripcion && (
                        <div className="text-gray-600 mt-1">{item.descripcion}</div>
                      )}
                      {item.ubicacion && (
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {item.ubicacion}
                        </div>
                      )}
                      <div className="text-sm text-gray-400 mt-2">
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
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Información de Contacto</h2>
            <div className="space-y-2">
              {contacto.nombre && <div><strong>Nombre:</strong> {contacto.nombre}</div>}
              {contacto.email && <div><strong>Email:</strong> {contacto.email}</div>}
              {contacto.telefono && <div><strong>Teléfono:</strong> {contacto.telefono}</div>}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
