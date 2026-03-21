"use client";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { createClient } from "@supabase/supabase-js";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import TopbarTienda from "../tienda/componentes/TopbarTienda";
import Footer from "~/components/Footer";

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
  payment_id?: string;
  payment_method?: string;
  numero_tracking?: string;
}

interface ProductoPedido {
  nombre: string;
  cantidad: number;
}


type EstadoConfig = {
  label: string;
  color: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const estadoConfig: Record<string, EstadoConfig> = {
  pendiente_pago: { label: "Pendiente de pago", color: "bg-yellow-100 text-yellow-800", icon: Clock as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  pagado: { label: "Pagado", color: "bg-blue-100 text-blue-800", icon: CheckCircle as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  en_preparacion: { label: "En preparación", color: "bg-purple-100 text-purple-800", icon: Package as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  en_envio: { label: "En envío", color: "bg-green-100 text-green-800", icon: Truck as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800", icon: CheckCircle as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle as React.ComponentType<React.SVGProps<SVGSVGElement>> },
  pendiente_cotizacion: { label: "Pendiente de cotización", color: "bg-orange-100 text-orange-800", icon: Clock as React.ComponentType<React.SVGProps<SVGSVGElement>> },
};

export default function EnviosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<{ id?: string } | null>(null);

  useEffect(() => {
    void (async () => {
      console.log("🔍 Fetching user and pedidos...");
      
      // Obtener usuario actual
      const { data } = await supabase.auth.getUser();
      console.log("👤 User data:", data?.user?.id);
      
      if (data?.user) {
        setUsuario({ id: data.user.id });
        
        // Obtener pedidos del usuario
        console.log("📦 Fetching pedidos for user:", data.user.id);
        const { data: pedidosData, error } = await supabase
          .from("pedidos")
          .select("*")
          .eq("cliente_id", data.user.id)
          .order("created_at", { ascending: false });
        
        console.log("📊 Pedidos response:", { pedidosData, error });
        
        if (error) {
          console.error("❌ Error fetching pedidos:", error);
        }
        
        if (pedidosData) {
          console.log(`✅ Pedidos encontrados: ${pedidosData.length}`);
          setPedidos(pedidosData as Pedido[]);
        } else {
          console.warn("⚠️ No pedidos data");
          setPedidos([]);
        }
      } else {
        console.warn("⚠️ No user logged in");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopbarTienda />
        <div className="flex-1 bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">Cargando pedidos...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopbarTienda />
        <div className="flex-1 bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold mb-4">Inicia sesión para ver tus pedidos</h1>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopbarTienda />
      <div className="flex-1 bg-gray-50 py-8 px-4">
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
              const safeEstado: EstadoConfig = estadoConfig[pedido.estado] ?? estadoConfig.pendiente_pago!;
              const IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>> = safeEstado?.icon ?? CheckCircle;
              
              let productos: ProductoPedido[] = [];
              if (typeof pedido.productos === "string") {
                try {
                  const parsed = JSON.parse(pedido.productos) as unknown;
                  productos = Array.isArray(parsed) ? (parsed as ProductoPedido[]) : [];
                } catch {
                  productos = [];
                }
              }

              // Parsear datos de contacto
              let datosContacto: { nombre?: string; email?: string; telefono?: string } = {};
              if (typeof pedido.datos_contacto === "string") {
                try {
                  const parsed = JSON.parse(pedido.datos_contacto) as unknown;
                  datosContacto = (typeof parsed === "object" && parsed !== null) ? (parsed as { nombre?: string; email?: string; telefono?: string }) : {};
                } catch {
                  datosContacto = {};
                }
              }

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
                      <Badge className={safeEstado.color}>
                        {safeEstado.label}
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
                        {pedido.estado === "pendiente_pago" && pedido.payment_id?.startsWith("http") && (
                          <div className="pt-2">
                            <a 
                              href={pedido.payment_id} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-full bg-[#00a19a] hover:bg-[#007973] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-teal-100"
                            >
                              💳 Pagar pedido ahora
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información de envío y Cotización */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Datos de contacto */}
                      {datosContacto.nombre && (
                        <div>
                          <h4 className="font-semibold mb-2">Datos de contacto</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {datosContacto.nombre && <div><strong>Nombre:</strong> {datosContacto.nombre}</div>}
                            {datosContacto.email && <div><strong>Email:</strong> {datosContacto.email}</div>}
                            {datosContacto.telefono && <div><strong>Teléfono:</strong> {datosContacto.telefono}</div>}
                          </div>
                        </div>
                      )}
                      
                      {/* Detalles de Cotización / Dirección */}
                      <div>
                        {pedido.notas_envio?.includes("[Cotización]") ? (
                          <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                            <h4 className="font-bold text-teal-900 mb-3 flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              Detalles de tu Cotización
                            </h4>
                            <div className="space-y-3">
                              {pedido.notas_envio.split("\n").map((line, i) => {
                                if (line.trim() === "[Cotización]") return null;
                                const [label, ...val] = line.split(":");
                                if (!val.length) return <p key={i} className="text-sm text-teal-800 leading-relaxed">{line}</p>;
                                return (
                                  <div key={i} className="flex flex-col sm:flex-row sm:gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-600/70 sm:w-24 shrink-0">{label?.trim() ?? ""}</span>
                                    <span className="text-sm font-bold text-teal-900 leading-snug">{val.join(":").trim()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="font-semibold mb-2">Dirección de envío</h4>
                            <div className="text-sm text-gray-600">
                              <div>{pedido.direccion_envio}</div>
                              <div>{pedido.ciudad_envio}, {pedido.departamento_envio}</div>
                              {pedido.codigo_postal_envio && <div>CP: {pedido.codigo_postal_envio}</div>}
                              {pedido.telefono_envio && <div>Tel: {pedido.telefono_envio}</div>}
                              {pedido.notas_envio && (
                                <div className="mt-2 text-xs italic">
                                  <strong>Notas:</strong> {pedido.notas_envio}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

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
      <Footer />
    </div>
  );
}
