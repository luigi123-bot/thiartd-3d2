"use client";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { DetallePedidoModal } from "./DetallePedidoModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Pedido {
  id: number;
  cliente_id: string;
  estado: string;
  created_at: string;
  total: number;
  subtotal?: number;
  costo_envio?: number;
  productos: string;
  datos_contacto?: string;
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  codigo_postal_envio?: string;
  telefono_envio?: string;
  notas_envio?: string;
  payment_id?: string;
  payment_method?: string;
}

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

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
  const [procesandoPago, setProcesandoPago] = useState<number | null>(null);

  const fetchPedidos = async () => {
    setLoading(true);
    console.log("🔍 Fetching pedidos from Supabase...");
    
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });
    
    console.log("📊 Supabase response:", { data, error });
    
    if (error) {
      console.error("❌ Error fetching pedidos:", error);
    }
    
    if (!error && Array.isArray(data)) {
      console.log(`✅ Pedidos encontrados: ${data.length}`);
      setPedidos(data);
    } else {
      console.warn("⚠️ No se encontraron pedidos o hubo un error");
      setPedidos([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    void fetchPedidos();
  }, []);

  // Función para simular pago aprobado (solo en desarrollo)
  const simularPagoAprobado = async (pedidoId: number) => {
    setProcesandoPago(pedidoId);
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId,
          estado: 'pagado',
          payment_id: `DEV-TEST-${Date.now()}`,
          payment_method: 'CARD',
        }),
      });

      if (response.ok) {
        alert('✅ Pago simulado correctamente');
        await fetchPedidos();
        if (detallePedido?.id === pedidoId) {
          const response = await supabase
            .from("pedidos")
            .select("*")
            .eq("id", pedidoId)
            .single();
          if (!response.error && response.data) setDetallePedido(response.data as Pedido);
        }
      } else {
        alert('❌ Error al simular el pago');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al simular el pago');
    } finally {
      setProcesandoPago(null);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestión de Pedidos</h1>
          <p className="text-gray-600">Administra y visualiza todos los pedidos de tu tienda</p>
        </div>

        {loading ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007973] mb-4"></div>
              <p className="text-gray-600">Cargando pedidos...</p>
            </div>
          </Card>
        ) : pedidos.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay pedidos registrados</h3>
              <p className="text-gray-500">Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#007973] to-[#00a19a] text-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Cliente</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Ubicación</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Fecha</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Total</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidos.map((p) => {
                    let productosArr: Producto[] = [];
                    if (typeof p.productos === "string") {
                      try {
                        const parsed = JSON.parse(p.productos) as unknown;
                        productosArr = Array.isArray(parsed) ? parsed as Producto[] : [];
                      } catch {
                        productosArr = [];
                      }
                    } else if (Array.isArray(p.productos)) {
                      productosArr = p.productos as Producto[];
                    } else {
                      productosArr = [];
                    }
                    
                    let datosContactoObj: DatosContacto = {};
                    if (typeof p.datos_contacto === "string") {
                      try {
                        const parsed = JSON.parse(p.datos_contacto) as unknown;
                        datosContactoObj = typeof parsed === "object" && parsed !== null ? parsed as DatosContacto : {};
                      } catch {
                        datosContactoObj = {};
                      }
                    } else if (typeof p.datos_contacto === "object" && p.datos_contacto !== null) {
                      datosContactoObj = p.datos_contacto as DatosContacto;
                    }
                    
                    const estadoBadge = p.estado === 'pagado' 
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : p.estado === 'pendiente_pago'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : p.estado === 'pago_rechazado' || p.estado === 'pago_cancelado'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200';
                    
                    const estadoIcon = p.estado === 'pagado' 
                      ? '✅'
                      : p.estado === 'pendiente_pago'
                      ? '⏳'
                      : p.estado === 'pago_rechazado'
                      ? '❌'
                      : '📋';
                    
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-[#007973] rounded-full flex items-center justify-center text-white font-semibold">
                              {(datosContactoObj.nombre ?? 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {datosContactoObj.nombre ?? 'Usuario'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {datosContactoObj.email ?? '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {p.ciudad_envio ?? '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {p.departamento_envio ?? '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${estadoBadge}`}>
                            <span className="mr-1">{estadoIcon}</span>
                            {p.estado.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(p.created_at).toLocaleDateString('es-ES', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(p.created_at).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-lg font-bold text-[#007973]">
                            ${Number(p.total).toLocaleString('es-CO')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {productosArr.length} producto{productosArr.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2 items-center">
                            <Button 
                              size="sm" 
                              onClick={() => setDetallePedido(p)}
                              className="w-full bg-[#007973] hover:bg-[#006060] text-white"
                            >
                              📄 Ver Detalle
                            </Button>
                            {p.estado === 'pendiente_pago' && (
                              <Button 
                                size="sm" 
                                onClick={() => simularPagoAprobado(p.id)}
                                disabled={procesandoPago === p.id}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                              >
                                {procesandoPago === p.id ? '⏳ Procesando...' : '✓ Aprobar'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
      
      {/* Modal de detalle de pedido */}
      <DetallePedidoModal
        pedido={detallePedido}
        onClose={() => setDetallePedido(null)}
        onAprobarPago={simularPagoAprobado}
        procesandoPago={procesandoPago}
      />
    </div>
  );
}
