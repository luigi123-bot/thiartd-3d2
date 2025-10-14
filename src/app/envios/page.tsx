"use client";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { createClient } from "@supabase/supabase-js";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Pedido {
  id: number;
  total: number;
  subtotal?: number;
  costo_envio?: number;
  estado: string;
  created_at: string;
  productos: string;
  datos_contacto: string;
  // Información de envío
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  codigo_postal_envio?: string;
  telefono_envio?: string;
  notas_envio?: string;
  payment_method?: string;
  numero_tracking?: string;
}

interface ProductoPedido {
  nombre: string;
  cantidad: number;
}


const estadoConfig = {
  pendiente_pago: { label: "Pendiente de pago", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  pagado: { label: "Pagado", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  en_preparacion: { label: "En preparación", color: "bg-purple-100 text-purple-800", icon: Package },
  en_envio: { label: "En envío", color: "bg-green-100 text-green-800", icon: Truck },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function EnviosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<{ id?: string } | null>(null);

  useEffect(() => {
    void (async () => {
      // Obtener usuario actual
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUsuario({ id: data.user.id });
        
        // Obtener pedidos del usuario
        const { data: pedidosData } = await supabase
          .from("pedidos")
          .select("*")
          .eq("cliente_id", data.user.id)
          .order("created_at", { ascending: false });
          
        setPedidos(pedidosData ?? []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">Cargando pedidos...</div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Inicia sesión para ver tus pedidos</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mis pedidos</h1>
        
        {pedidos.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No tienes pedidos aún</h2>
            <p className="text-gray-500">Cuando realices una compra, aparecerá aquí</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => {
              const estado = estadoConfig[pedido.estado as keyof typeof estadoConfig] ?? estadoConfig.pendiente_pago;
              const IconComponent = estado.icon;
              
              let productos: ProductoPedido[] = [];
              if (typeof pedido.productos === "string") {
                try {
                  const parsed = JSON.parse(pedido.productos) as unknown;
                  productos = Array.isArray(parsed) ? parsed as ProductoPedido[] : [];
                } catch {
                  productos = [];
                }
              }

              // Nota: datosContacto se parsea pero no se usa por simplicidad del componente
              // Podrías usarlo para mostrar información adicional si fuera necesario

              return (
                <Card key={pedido.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Pedido #{pedido.id}</h3>
                      <p className="text-gray-600">
                        {new Date(pedido.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-5 h-5" />
                      <Badge className={estado.color}>
                        {estado.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Productos</h4>
                      <div className="space-y-1">
                        {productos.map((producto, idx) => (
                          <div key={idx} className="text-sm">
                            {producto.cantidad}x {producto.nombre}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Detalles del pedido</h4>
                      <div className="text-sm space-y-1">
                        <div>Subtotal: <span className="font-medium">${Number(pedido.subtotal ?? pedido.total).toFixed(0)}</span></div>
                        <div>Envío: <span className="font-medium">${Number(pedido.costo_envio ?? 0).toFixed(0)}</span></div>
                        <div>Total: <span className="font-medium">${Number(pedido.total).toFixed(0)}</span></div>
                        {pedido.payment_method && (
                          <div>Método de pago: <span className="text-gray-600">{pedido.payment_method}</span></div>
                        )}
                        {pedido.numero_tracking && (
                          <div>Tracking: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{pedido.numero_tracking}</span></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información de envío */}
                  {pedido.direccion_envio && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2">Dirección de envío</h4>
                      <div className="text-sm text-gray-600">
                        <div>{pedido.direccion_envio}</div>
                        <div>{pedido.ciudad_envio}, {pedido.departamento_envio}</div>
                        {pedido.codigo_postal_envio && <div>CP: {pedido.codigo_postal_envio}</div>}
                        {pedido.telefono_envio && <div>Tel: {pedido.telefono_envio}</div>}
                        {pedido.notas_envio && (
                          <div className="mt-2 text-xs">
                            <strong>Notas:</strong> {pedido.notas_envio}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botón de tracking */}
                  <div className="mt-4 pt-4 border-t">
                    <Link 
                      href={`/tienda/tracking/${pedido.id}`}
                      className="inline-flex items-center gap-2 text-[#00a19a] hover:underline"
                    >
                      <Truck className="w-4 h-4" />
                      Ver seguimiento detallado
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
