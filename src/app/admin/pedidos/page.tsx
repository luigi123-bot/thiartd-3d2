"use client";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Pedido {
  id: string;
  cliente: string;
  direccion: string;
  estado: string;
  fecha: string;
}

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("pedidos").select("id, cliente, direccion, estado, fecha");
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
                <th className="p-2">Dirección</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.cliente}</td>
                  <td className="p-2">{p.direccion}</td>
                  <td className="p-2 font-bold">{p.estado}</td>
                  <td className="p-2">{p.fecha}</td>
                  <td className="p-2">
                    <Button size="sm" variant="secondary">Ver detalle</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
