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
  direccion?: string;
  estado: string;
  created_at: string;
  total: number;
  productos: string;
  datos_contacto?: string;
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
                {/* <th className="p-2">ID</th> <-- Eliminado */}
                <th className="p-2">Cliente</th>
                <th className="p-2">Dirección</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Fecha</th>
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
                    {/* <td className="p-2">{p.id}</td> <-- Eliminado */}
                    <td className="p-2">{datosContactoObj.nombre ?? p.cliente_id}</td>
                    <td className="p-2">{p.direccion ?? "-"}</td>
                    <td className="p-2 font-bold">{p.estado}</td>
                    <td className="p-2">{p.created_at?.slice(0, 19).replace("T", " ")}</td>
                    <td className="p-2">${Number(p.total).toFixed(2)}</td>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del pedido</DialogTitle>
          </DialogHeader>
          {detallePedido && (
            <div>
              <div className="mb-2 font-semibold">Cliente: {(() => {
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
              <div className="mb-2">Dirección: {detallePedido.direccion ?? "-"}</div>
              <div className="mb-2">Estado: <b>{detallePedido.estado}</b></div>
              <div className="mb-2">Fecha: {detallePedido.created_at?.slice(0, 19).replace("T", " ")}</div>
              <div className="mb-2">Total: ${Number(detallePedido.total).toFixed(2)}</div>
              <div className="mb-2 font-semibold">Productos:</div>
              <ul className="text-sm ml-2">
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
                  <li key={idx} className="mb-1">
                    <b>{prod.titulo ?? prod.nombre ?? prod.producto_id}</b>
                    {prod.descripcion && <span className="ml-2 text-gray-500">({prod.descripcion})</span>}
                  </li>
                ))}
              </ul>
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
