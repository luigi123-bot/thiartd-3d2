"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function AdminMensajesPage() {
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMensajes() {
      setLoading(true);
      const res = await fetch("/api/mensajes");
      const data = await res.json();
      setMensajes(Array.isArray(data.mensajes) ? data.mensajes : []);
      setLoading(false);
    }
    fetchMensajes();
  }, []);

  return (
    <div className="min-h-screen p-10 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Mensajes de Contacto</h1>
      {loading ? (
        <div className="text-center py-8">Cargando mensajes...</div>
      ) : mensajes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No hay mensajes recibidos.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mensajes.map((msg) => (
            <Card key={msg.id}>
              <CardHeader>
                <CardTitle>{msg.nombre} ({msg.email})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-gray-700 whitespace-pre-line">{msg.mensaje}</div>
                <div className="text-xs text-gray-400 mt-2">{msg.creado_en ? msg.creado_en.slice(0, 19).replace("T", " ") : "-"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
