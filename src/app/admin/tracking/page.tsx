"use client";
import { useState, useEffect } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "~/components/ui/use-toast";
import { Package, Truck, MapPin, Clock, CheckCircle } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Pedido {
  id: number;
  cliente_id: string;
  estado: string;
  total: number;
  datos_contacto: string;
  numero_tracking?: string;
  empresa_envio?: string;
  fecha_estimada_entrega?: string;
  created_at: string;
}

interface HistorialEnvio {
  id: number;
  estado: string;
  descripcion?: string;
  ubicacion?: string;
  fecha: string;
}

interface TrackingApiResponse {
  historial: HistorialEnvio[];
}

interface TrackingErrorResponse {
  error: string;
}

interface EstadoInfo {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const estadosEnvio: EstadoInfo[] = [
  { value: "pendiente_pago", label: "Pendiente de pago", icon: Clock, color: "text-yellow-600" },
  { value: "pagado", label: "Pagado", icon: CheckCircle, color: "text-green-600" },
  { value: "en_preparacion", label: "En preparación", icon: Package, color: "text-blue-600" },
  { value: "en_envio", label: "En envío", icon: Truck, color: "text-purple-600" },
  { value: "en_transito", label: "En tránsito", icon: MapPin, color: "text-orange-600" },
  { value: "entregado", label: "Entregado", icon: CheckCircle, color: "text-green-600" },
  { value: "problema_entrega", label: "Problema entrega", icon: Package, color: "text-red-600" },
];

export default function TrackingAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [historial, setHistorial] = useState<HistorialEnvio[]>([]);
  const [loading, setLoading] = useState(false);
  const [actualizandoTracking, setActualizandoTracking] = useState(false);
  const { toast } = useToast();

  const [formTracking, setFormTracking] = useState({
    estado: "",
    descripcion: "",
    ubicacion: "",
    numero_tracking: "",
    empresa_envio: "",
    fecha_estimada_entrega: ""
  });

  // Cargar pedidos
  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("pedidos")
        .select("*")
        .neq("estado", "pendiente_pago")
        .order("created_at", { ascending: false });
      
      setPedidos(data ?? []);
      setLoading(false);
    };

    void fetchPedidos();
  }, []);

  // Cargar historial cuando se selecciona un pedido
  useEffect(() => {
    if (pedidoSeleccionado) {
      const fetchHistorial = async () => {
        const response = await fetch(`/api/tracking?pedido_id=${pedidoSeleccionado.id}`);
        const data = await response.json() as TrackingApiResponse;
        setHistorial(data.historial ?? []);
      };

      void fetchHistorial();

      // Pre-llenar formulario con datos existentes
      setFormTracking({
        estado: pedidoSeleccionado.estado,
        descripcion: "",
        ubicacion: "",
        numero_tracking: pedidoSeleccionado.numero_tracking ?? "",
        empresa_envio: pedidoSeleccionado.empresa_envio ?? "",
        fecha_estimada_entrega: pedidoSeleccionado.fecha_estimada_entrega 
          ? new Date(pedidoSeleccionado.fecha_estimada_entrega).toISOString().split('T')[0]
          : ""
      });
    }
  }, [pedidoSeleccionado]);

  const actualizarTracking = async () => {
    if (!pedidoSeleccionado) return;

    setActualizandoTracking(true);

    try {
      const response = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: pedidoSeleccionado.id,
          ...formTracking
        })
      });

      if (response.ok) {
        toast({
          title: "Tracking actualizado",
          description: "El estado del pedido ha sido actualizado correctamente"
        });

        // Recargar datos
        const { data } = await supabase
          .from("pedidos")
          .select("*")
          .eq("id", pedidoSeleccionado.id)
          .single<Pedido>();

        if (data) {
          setPedidoSeleccionado(data);
          setPedidos(prev => prev.map(p => p.id === data.id ? data : p));
        }

        // Recargar historial
        const historialResponse = await fetch(`/api/tracking?pedido_id=${pedidoSeleccionado.id}`);
        const historialData = await historialResponse.json() as TrackingApiResponse;
        setHistorial(historialData.historial ?? []);

      } else {
        const errorData = await response.json() as TrackingErrorResponse;
        toast({
          title: "Error",
          description: errorData.error ?? "Error actualizando tracking",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error actualizando tracking:", error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      });
    } finally {
      setActualizandoTracking(false);
    }
  };

  const getEstadoInfo = (estado: string): EstadoInfo => {
    const estadoEncontrado = estadosEnvio.find(e => e.value === estado);
    return estadoEncontrado ?? estadosEnvio[0];
  };

  const getContactInfo = (datosContacto: string): { nombre?: string; email?: string } => {
    try {
      return JSON.parse(datosContacto) as { nombre?: string; email?: string };
    } catch {
      return {};
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-[#007973]">Gestión de Tracking</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de pedidos */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Pedidos Activos</h2>
          {loading ? (
            <div className="text-center py-4">Cargando...</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pedidos.map((pedido) => {
                const estadoInfo = getEstadoInfo(pedido.estado);
                const IconComponent = estadoInfo.icon;
                const contacto = getContactInfo(pedido.datos_contacto);
                
                return (
                  <div
                    key={pedido.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      pedidoSeleccionado?.id === pedido.id 
                        ? "bg-[#00a19a] text-white" 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setPedidoSeleccionado(pedido)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Pedido #{pedido.id}</div>
                        <div className="text-sm opacity-80">
                          {contacto.nombre ?? contacto.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-4 h-4 ${pedidoSeleccionado?.id === pedido.id ? "text-white" : estadoInfo.color}`} />
                        <span className="text-xs">{estadoInfo.label}</span>
                      </div>
                    </div>
                    {pedido.numero_tracking && (
                      <div className="text-xs mt-1 opacity-80">
                        Tracking: {pedido.numero_tracking}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Actualizar tracking */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Actualizar Tracking</h2>
          
          {pedidoSeleccionado ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={formTracking.estado}
                  onChange={(e) => setFormTracking({...formTracking, estado: e.target.value})}
                  aria-label="Seleccionar estado del envío"
                >
                  {estadosEnvio.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Número de tracking</label>
                <Input
                  value={formTracking.numero_tracking}
                  onChange={(e) => setFormTracking({...formTracking, numero_tracking: e.target.value})}
                  placeholder="TK123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Empresa de envío</label>
                <Input
                  value={formTracking.empresa_envio}
                  onChange={(e) => setFormTracking({...formTracking, empresa_envio: e.target.value})}
                  placeholder="Coordinadora, Envía, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ubicación actual</label>
                <Input
                  value={formTracking.ubicacion}
                  onChange={(e) => setFormTracking({...formTracking, ubicacion: e.target.value})}
                  placeholder="Bogotá, Centro de distribución"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <Input
                  value={formTracking.descripcion}
                  onChange={(e) => setFormTracking({...formTracking, descripcion: e.target.value})}
                  placeholder="Descripción del estado actual"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha estimada de entrega</label>
                <Input
                  type="date"
                  value={formTracking.fecha_estimada_entrega}
                  onChange={(e) => setFormTracking({...formTracking, fecha_estimada_entrega: e.target.value})}
                />
              </div>

              <Button 
                onClick={actualizarTracking}
                disabled={actualizandoTracking}
                className="w-full"
              >
                {actualizandoTracking ? "Actualizando..." : "Actualizar Tracking"}
              </Button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Selecciona un pedido para actualizar su tracking
            </div>
          )}
        </Card>

        {/* Historial de tracking */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Historial de Envío</h2>
          
          {pedidoSeleccionado ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historial.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No hay historial disponible
                </div>
              ) : (
                historial.map((item, index) => {
                  const estadoInfo = getEstadoInfo(item.estado);
                  const IconComponent = estadoInfo.icon;
                  
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full bg-gray-100`}>
                          <IconComponent className={`w-4 h-4 ${estadoInfo.color}`} />
                        </div>
                        {index < historial.length - 1 && (
                          <div className="w-px h-8 bg-gray-300 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{estadoInfo.label}</div>
                        {item.descripcion && (
                          <div className="text-sm text-gray-600">{item.descripcion}</div>
                        )}
                        {item.ubicacion && (
                          <div className="text-sm text-gray-500">📍 {item.ubicacion}</div>
                        )}
                        <div className="text-xs text-gray-400">
                          {new Date(item.fecha).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Selecciona un pedido para ver su historial
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
