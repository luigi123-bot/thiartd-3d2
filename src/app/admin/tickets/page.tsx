"use client";
import React, { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { FiCheckCircle, FiAlertTriangle, FiClock, FiXCircle, FiMail } from "react-icons/fi";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const ESTADOS = [
  { value: "abierto", label: "Abierto", color: "bg-blue-500" },
  { value: "en_progreso", label: "En progreso", color: "bg-yellow-500" },
  { value: "resuelto", label: "Resuelto", color: "bg-green-500" },
  { value: "cerrado", label: "Cerrado", color: "bg-gray-400" },
];
const CATEGORIAS = [
  "Error",
  "Sugerencia",
  "Consulta",
  "Otro"
];

export default function AdminTicketsPage() {
  interface Ticket {
    id: number;
    titulo: string;
    descripcion: string;
    categoria: string;
    estado: string;
    created_at: string;
    imagen_url?: string;
  }

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [modalTicket, setModalTicket] = useState<Record<string, unknown> | null>(null);

  // Cargar tickets
  const fetchTickets = React.useCallback(async () => {
    setLoading(true);
    // Solo selecciona los campos que existen en tu tabla
    let query = supabase
      .from("tickets")
      .select("id,titulo,descripcion,categoria,estado,created_at,imagen_url")
      .order("created_at", { ascending: false });
    if (estadoFiltro) query = query.eq("estado", estadoFiltro);
    if (categoriaFiltro) query = query.eq("categoria", categoriaFiltro);
    const { data, error } = await query;
    if (error) {
      console.error("Error al obtener tickets:", error);
      setTickets([]);
    } else {
      setTickets(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [estadoFiltro, categoriaFiltro]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  // Cambiar estado del ticket
  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    await supabase.from("tickets").update({ estado: nuevoEstado }).eq("id", id);
    void fetchTickets();
  };

  // Estadísticas para burbujas
  const total = tickets.length;
  const abiertos = tickets.filter(t => t.estado === "abierto").length;
  const enProgreso = tickets.filter(t => t.estado === "en_progreso").length;
  const resueltos = tickets.filter(t => t.estado === "resuelto").length;
  const cerrados = tickets.filter(t => t.estado === "cerrado").length;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tickets</h1>
          <p className="text-gray-500">Administra y responde los tickets de soporte y errores.</p>
        </div>
        <Button onClick={() => setModalTicket({})}>Nuevo Ticket</Button>
      </div>
      {/* Burbujas de estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 flex flex-col items-center">
          <FiMail className="text-2xl mb-1" />
          <div className="text-xl font-bold">{total}</div>
          <div className="text-gray-500 text-sm">Total Tickets</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <FiClock className="text-2xl mb-1 text-blue-500" />
          <div className="text-xl font-bold">{abiertos}</div>
          <div className="text-gray-500 text-sm">Abiertos</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <FiAlertTriangle className="text-2xl mb-1 text-yellow-500" />
          <div className="text-xl font-bold">{enProgreso}</div>
          <div className="text-gray-500 text-sm">En progreso</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <FiCheckCircle className="text-2xl mb-1 text-green-500" />
          <div className="text-xl font-bold">{resueltos}</div>
          <div className="text-gray-500 text-sm">Resueltos</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <FiXCircle className="text-2xl mb-1 text-gray-400" />
          <div className="text-xl font-bold">{cerrados}</div>
          <div className="text-gray-500 text-sm">Cerrados</div>
        </Card>
      </div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <label htmlFor="estado-filtro" className="sr-only">Filtrar por estado</label>
        <select
          id="estado-filtro"
          className="border rounded px-3 py-2"
          value={estadoFiltro}
          onChange={e => setEstadoFiltro(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <label htmlFor="categoria-filtro" className="sr-only">Filtrar por categoría</label>
        <select
          id="categoria-filtro"
          className="border rounded px-3 py-2"
          value={categoriaFiltro}
          onChange={e => setCategoriaFiltro(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {/* Tabla de tickets */}
      <Card>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-2">ID</th>
                <th className="text-left py-2 px-2">Título</th>
                <th className="text-left py-2 px-2">Categoría</th>
                <th className="text-left py-2 px-2">Estado</th>
                <th className="text-left py-2 px-2">Fecha</th>
                <th className="text-left py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">Cargando tickets...</td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">No hay tickets.</td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 px-2">{t.id}</td>
                    <td className="py-2 px-2">{t.titulo}</td>
                    <td className="py-2 px-2">{t.categoria}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${ESTADOS.find(e => e.value === t.estado)?.color ?? "bg-gray-200"}`}>
                        {ESTADOS.find(e => e.value === t.estado)?.label ?? t.estado}
                      </span>
                    </td>
                    <td className="py-2 px-2">{t.created_at ? new Date(t.created_at).toLocaleString() : ""}</td>
                    <td className="py-2 px-2">
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        value={t.estado}
                        onChange={e => cambiarEstado(t.id, e.target.value)}
                        aria-label="Cambiar estado del ticket"
                      >
                        {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Modal para crear ticket */}
      {modalTicket && (
        <TicketModal
          open={!!modalTicket}
          onOpenChange={v => setModalTicket(v ? {} : null)}
          onTicketCreated={fetchTickets}
        />
      )}
    </div>
  );
}

// Modal para crear ticket
function TicketModal({ onOpenChange, onTicketCreated }: { open: boolean, onOpenChange: (v: boolean) => void, onTicketCreated: () => void }) {
  interface Ticket {
    id: number;
    titulo: string;
    descripcion: string;
    categoria: string;
    estado: string;
    created_at: string;
    imagen_url?: string;
  }
  const [form, setForm] = useState({ titulo: "", descripcion: "", categoria: CATEGORIAS[0] });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ticketData = {
      titulo: form.titulo,
      descripcion: form.descripcion,
      categoria: form.categoria,
      estado: "abierto",
      created_at: new Date().toISOString(),
    };
    console.log("Intentando guardar ticket en Supabase:", ticketData);

    try {
      const { data, error }: { data: Ticket | null; error: { message: string; details?: string; hint?: string } | null } = await supabase.from("tickets").insert([ticketData]).select().single();
      console.log("Respuesta de Supabase:", { data, error });
      setLoading(false);
      if (!error && data) {
        // Enviar correo al admin (ajusta el endpoint según tu backend)
        fetch("/api/enviar-correo-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "admin@thiart3d.com",
            subject: "Nuevo Ticket de Soporte",
            text: `Se ha creado un nuevo ticket:\n\nTítulo: ${form.titulo}\nCategoría: ${form.categoria}\nDescripción: ${form.descripcion}`,
          }),
        }).catch((error) => {
          console.error("Error al enviar el correo al admin:", error);
        });
        onOpenChange(false);
        onTicketCreated();
      } else {
        alert("Error al guardar el ticket: " + (error?.message ?? "Error desconocido"));
      }
    } catch (err) {
      setLoading(false);
      console.error("Excepción al guardar el ticket:", err);
      alert("Error inesperado al guardar el ticket.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Nuevo Ticket</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="titulo"
            className="border rounded px-3 py-2"
            placeholder="Título"
            value={form.titulo}
            onChange={handleChange}
            required
          />
          <label htmlFor="modal-categoria" className="sr-only">Categoría</label>
          <select
            id="modal-categoria"
            name="categoria"
            className="border rounded px-3 py-2"
            value={form.categoria}
            onChange={handleChange}
            aria-label="Categoría"
          >
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            name="descripcion"
            className="border rounded px-3 py-2 min-h-[80px]"
            placeholder="Describe el problema o sugerencia"
            value={form.descripcion}
            onChange={handleChange}
            required
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Enviando..." : "Crear Ticket"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

