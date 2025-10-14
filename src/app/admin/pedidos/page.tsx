"use client";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

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
  productos: string;
  datos_contacto?: string;
  // Información de envío
  direccion_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
  codigo_postal_envio?: string;
  telefono_envio?: string;
  notas_envio?: string;
  payment_id?: string;
  payment_method?: string;
}

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) setPedidos(data);
      setLoading(false);
    };
    void fetchPedidos();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-[#007973]">Gestión de Pedidos</h1>
      <Card className="p-6">
        {loading ? (
          <div className="text-center py-8">Cargando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay pedidos registrados.</div>
        ) : (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Cliente</th>
                <th className="p-2">Ciudad de envío</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Subtotal</th>
                <th className="p-2">Envío</th>
                <th className="p-2">Total</th>
                <th className="p-2">Acción</th>
              </tr>
            </thead>
            <tbody>
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
                
                return (
                  <tr key={p.id} className="border-b">
                    <td className="p-2">{datosContactoObj.nombre ?? p.cliente_id}</td>
                    <td className="p-2">
                      {p.ciudad_envio ? `${p.ciudad_envio}, ${p.departamento_envio}` : "-"}
                    </td>
                    <td className="p-2 font-bold">{p.estado}</td>
                    <td className="p-2">{p.created_at?.slice(0, 19).replace("T", " ")}</td>
                    <td className="p-2">${Number(p.subtotal ?? p.total).toFixed(2)}</td>
                    <td className="p-2">${Number(p.costo_envio ?? 0).toFixed(2)}</td>
                    <td className="p-2 font-bold">${Number(p.total).toFixed(2)}</td>
                    <td className="p-2">
                      <Button size="sm" variant="secondary" onClick={() => setDetallePedido(p)}>
                        Ver detalle
                      </Button>
                      {productosArr.length > 0 && (
                        <div className="text-xs mt-2 text-gray-500">
                          Productos: {productosArr.map((prod) => prod.titulo ?? prod.nombre ?? prod.producto_id).join(", ")}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      
      {/* Modal de detalle de pedido */}
      <Dialog open={!!detallePedido} onOpenChange={v => !v && setDetallePedido(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del pedido #{detallePedido?.id}</DialogTitle>
          </DialogHeader>
          {detallePedido && (
            <div className="space-y-4">
              {/* Información del cliente */}
              <div>
                <h3 className="font-semibold mb-2">Información del cliente</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <div>Cliente: {(() => {
                    let datosContactoObj: DatosContacto = {};
                    if (typeof detallePedido.datos_contacto === "string") {
                      try {
                        const parsed = JSON.parse(detallePedido.datos_contacto) as unknown;
                        datosContactoObj = typeof parsed === "object" && parsed !== null ? parsed as DatosContacto : {};
                      } catch {
                        datosContactoObj = {};
                      }
                    } else if (typeof detallePedido.datos_contacto === "object" && detallePedido.datos_contacto !== null) {
                      datosContactoObj = detallePedido.datos_contacto as DatosContacto;
                    }
                    return datosContactoObj.nombre ?? detallePedido.cliente_id;
                  })()}</div>
                  <div>Email: {(() => {
                    let datosContactoObj: DatosContacto = {};
                    if (typeof detallePedido.datos_contacto === "string") {
                      try {
                        const parsed = JSON.parse(detallePedido.datos_contacto) as unknown;
                        datosContactoObj = typeof parsed === "object" && parsed !== null ? parsed as DatosContacto : {};
                      } catch {
                        datosContactoObj = {};
                      }
                    }
                    return datosContactoObj.email ?? "-";
                  })()}</div>
                  <div>Teléfono: {detallePedido.telefono_envio ?? "-"}</div>
                </div>
              </div>

              {/* Información de envío */}
              <div>
                <h3 className="font-semibold mb-2">Información de envío</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <div>Dirección: {detallePedido.direccion_envio ?? "-"}</div>
                  <div>Ciudad: {detallePedido.ciudad_envio ?? "-"}</div>
                  <div>Departamento: {detallePedido.departamento_envio ?? "-"}</div>
                  <div>Código postal: {detallePedido.codigo_postal_envio ?? "-"}</div>
                  {detallePedido.notas_envio && (
                    <div>Notas: {detallePedido.notas_envio}</div>
                  )}
                </div>
              </div>

              {/* Información del pedido */}
              <div>
                <h3 className="font-semibold mb-2">Información del pedido</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <div>Estado: <span className="font-bold">{detallePedido.estado}</span></div>
                  <div>Fecha: {detallePedido.created_at?.slice(0, 19).replace("T", " ")}</div>
                  <div>Subtotal: ${Number(detallePedido.subtotal ?? detallePedido.total).toFixed(2)}</div>
                  <div>Costo de envío: ${Number(detallePedido.costo_envio ?? 0).toFixed(2)}</div>
                  <div>Total: <span className="font-bold">${Number(detallePedido.total).toFixed(2)}</span></div>
                  {detallePedido.payment_method && (
                    <div>Método de pago: {detallePedido.payment_method}</div>
                  )}
                  {detallePedido.payment_id && (
                    <div>ID de transacción: {detallePedido.payment_id}</div>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div>
                <h3 className="font-semibold mb-2">Productos</h3>
                <ul className="text-sm ml-2 space-y-1">
                  {(typeof detallePedido.productos === "string"
                    ? (() => { 
                        try { 
                          const parsed = JSON.parse(detallePedido.productos) as unknown;
                          return Array.isArray(parsed) ? parsed as Producto[] : [];
                        } catch { 
                          return []; 
                        } 
                      })()
                    : Array.isArray(detallePedido.productos)
                    ? detallePedido.productos as Producto[]
                    : []
                  ).map((prod: Producto, idx: number) => (
                    <li key={idx} className="bg-gray-50 p-2 rounded">
                      <div className="font-bold">{prod.titulo ?? prod.nombre ?? prod.producto_id}</div>
                      <div>Cantidad: {prod.cantidad}</div>
                      <div>Precio unitario: ${prod.precio_unitario}</div>
                      <div>Total: ${(prod.cantidad * prod.precio_unitario).toFixed(2)}</div>
                      {prod.descripcion && <div className="text-gray-600">({prod.descripcion})</div>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDetallePedido(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
