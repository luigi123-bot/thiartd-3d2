"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createClient } from "@supabase/supabase-js";
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Search, 
  Download, 
  ArrowUpRight,
  ChevronRight,
  History,
  Send,
  Calendar as CalendarIcon,
  Filter,
  Printer,
  CalendarPlus,
  RefreshCw,
  Eye,
  Building2,
  Phone,
  User,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DetallePedidoModal } from "~/components/DetallePedidoModal";
import RecoleccionesModal from "~/components/RecoleccionesModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Pedido {
  id: number;
  cliente_id: string;
  estado: string;
  total: number;
  subtotal?: number;
  costo_envio?: number;
  tipo_entrega?: "envio" | "recoleccion";
  es_pod?: boolean;
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
  numero_tracking?: string;
  empresa_envio?: string;
  pdf_guia_url?: string;
  guia_detalles?: string;
  fecha_estimada_entrega?: string;
  created_at: string;
}

interface Recogida {
  id?: number;
  carrier: string;
  confirmation_number: string;
  pickup_date: string;
  pickup_time_from: string;
  pickup_time_to: string;
  origin_address: string;
  origin_city: string;
  total_packages: number;
  total_weight: number;
  instructions?: string;
  status: string;
  created_at?: string;
}

export default function EnviosAdminPage() {
  const [activeTab, setActiveTab] = useState<"envios" | "recogidas">("envios");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [recogidas, setRecogidas] = useState<Recogida[]>([]);
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);
  const [modalRecoleccionesOpen, setModalRecoleccionesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [generandoGuiaId, setGenerandoGuiaId] = useState<number | null>(null);

  // Formulario de Programación de Recogida
  const [formRecogida, setFormRecogida] = useState({
    carrier: "coordinadora",
    pickupDate: new Date(Date.now() + 86400000).toISOString().split("T")[0]!, // Mañana por defecto
    pickupTimeFrom: "09:00",
    pickupTimeTo: "17:00",
    totalPackages: 1,
    totalWeight: 1.0,
    instructions: "Taller Thiart 3D (Calle 5 #24A-152, Cali). Favor timbrar.",
  });
  const [programandoRecogida, setProgramandoRecogida] = useState(false);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pedidos:", error);
    } else if (data) {
      setPedidos(data as Pedido[]);
    }
    setLoading(false);
  }, []);

  const fetchRecogidas = useCallback(async () => {
    try {
      const res = await fetch("/api/envios/recogidas");
      const data = (await res.json()) as { success?: boolean; recogidas?: Recogida[] };
      if (data.success && data.recogidas) {
        setRecogidas(data.recogidas);
      }
    } catch (e) {
      console.error("Error fetching recogidas:", e);
    }
  }, []);

  useEffect(() => {
    void fetchPedidos();
    void fetchRecogidas();
  }, [fetchPedidos, fetchRecogidas]);

  const handleGenerarGuia = async (pedidoId: number) => {
    setGenerandoGuiaId(pedidoId);
    try {
      const res = await fetch("/api/tracking/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId }),
      });
      const data = (await res.json()) as { success?: boolean; numero_tracking?: string; error?: string };

      if (data.success) {
        toast.success(`Guía generada con éxito: #${data.numero_tracking ?? ""}`);
        await fetchPedidos();
      } else {
        toast.error(data.error ?? "No se pudo generar la guía");
      }
    } catch {
      toast.error("Error al conectar con el servidor");
    } finally {
      setGenerandoGuiaId(null);
    }
  };

  const handleProgramarRecogida = async (e: React.FormEvent) => {
    e.preventDefault();
    setProgramandoRecogida(true);
    try {
      const res = await fetch("/api/envios/recogidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formRecogida),
      });
      const data = (await res.json()) as { success?: boolean; mensaje?: string; error?: string };

      if (data.success) {
        toast.success(data.mensaje ?? "Recogida programada con la transportadora");
        await fetchRecogidas();
      } else {
        toast.error(data.error ?? "Error al programar recogida");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setProgramandoRecogida(false);
    }
  };

  const enviosFiltrados = pedidos.filter((p) => {
    if (p.tipo_entrega === "recoleccion") return false; // Solo envíos a domicilio
    if (!searchTerm) return true;
    const str = `${p.id} ${p.numero_tracking ?? ""} ${p.ciudad_envio ?? ""} ${p.empresa_envio ?? ""}`.toLowerCase();
    return str.includes(searchTerm.toLowerCase());
  });

  const totalConGuia = enviosFiltrados.filter((p) => Boolean(p.numero_tracking)).length;
  const totalPendientesGuia = enviosFiltrados.filter((p) => !p.numero_tracking).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Top Bar / Header ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestor de Envíos & Recogidas</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Control de guías logísticas con Envía, transportadoras nacionales y programación de recolecciones
            </p>
          </div>

          {/* Selector de Pestañas y Botón Modal Recolecciones */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setModalRecoleccionesOpen(true)}
              className="bg-[#1877f2] hover:bg-[#1565c0] text-white font-bold text-xs h-10 px-4 rounded-2xl shadow-md flex items-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Solicitar Recolección</span>
            </Button>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab("envios")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === "envios"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Envíos</span>
                <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                  {enviosFiltrados.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("recogidas")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === "recogidas"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historial</span>
                {recogidas.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center">
                    {recogidas.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── KPIs Rápidos ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00a19a] flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Envíos a Domicilio</span>
              <p className="text-2xl font-black text-slate-900">{enviosFiltrados.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guías Generadas</span>
              <p className="text-2xl font-black text-slate-900">{totalConGuia}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendientes por Generar</span>
              <p className="text-2xl font-black text-slate-900">{totalPendientesGuia}</p>
            </div>
          </div>
        </div>

        {/* ── CONTENIDO: PESTAÑA 1: ENVÍOS & GUÍAS ── */}
        {activeTab === "envios" && (
          <div className="space-y-4">
            {/* Barra de búsqueda */}
            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID de pedido, número de guía o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none focus:ring-2 focus:ring-[#00a19a]"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchPedidos()}
                className="h-10 px-3 rounded-xl border-slate-200 text-slate-600 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refrescar</span>
              </Button>
            </div>

            {/* Lista de Órdenes para Envío */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              {enviosFiltrados.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-sm font-bold">No hay envíos registrados</p>
                </div>
              ) : (
                enviosFiltrados.map((p) => {
                  let contacto: { nombre?: string; email?: string; telefono?: string } = {};
                  try {
                    contacto = typeof p.datos_contacto === "string" ? JSON.parse(p.datos_contacto) : p.datos_contacto || {};
                  } catch {
                    // ignore
                  }

                  const tieneGuia = Boolean(p.numero_tracking);

                  return (
                    <div key={p.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      {/* Info Pedido & Cliente */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#00a19a] bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                            #{p.id}
                          </span>
                          <span className="text-xs font-black text-slate-900 truncate">
                            {contacto.nombre || "Cliente"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(p.created_at).toLocaleDateString("es-CO")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.direccion_envio || "Dirección no especificada"} — <strong>{p.ciudad_envio || "Ciudad"}</strong></span>
                        </p>
                      </div>

                      {/* Estado de la Guía */}
                      <div className="flex items-center gap-3">
                        {tieneGuia ? (
                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Guía Oficial
                            </span>
                            <p className="text-xs font-black text-slate-900 mt-0.5">
                              #{p.numero_tracking}{" "}
                              <span className="text-[10px] font-bold text-slate-400 uppercase">({p.empresa_envio || "Envía"})</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                            ⏳ Pendiente por generar guía
                          </span>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-2">
                        {/* Botón Ver Ficha Completa */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPedidoDetalle(p)}
                          className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 hover:bg-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#00a19a]" />
                          <span>Ver Ficha</span>
                        </Button>

                        {/* Botón Imprimir PDF si tiene */}
                        {p.pdf_guia_url && (
                          <Button
                            asChild
                            size="sm"
                            className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
                          >
                            <a href={p.pdf_guia_url} target="_blank" rel="noopener noreferrer">
                              <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir
                            </a>
                          </Button>
                        )}

                        {/* Botón Generar Guía Manual */}
                        {!tieneGuia && (
                          <Button
                            size="sm"
                            disabled={generandoGuiaId === p.id}
                            onClick={() => handleGenerarGuia(p.id)}
                            className="h-9 px-3 rounded-xl bg-[#00a19a] hover:bg-[#007973] text-white text-xs font-black uppercase tracking-wider shadow-md"
                          >
                            {generandoGuiaId === p.id ? "Generando..." : "🚀 Generar Guía"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── CONTENIDO: PESTAÑA 2: PROGRAMAR RECOGIDA (PICKUP) ── */}
        {activeTab === "recogidas" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Formulario de Recogida */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00a19a] flex items-center justify-center">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Solicitar Recogida</h3>
                  <p className="text-xs text-slate-400 font-medium">Conexión directa con la API de la transportadora</p>
                </div>
              </div>

              <form onSubmit={handleProgramarRecogida} className="space-y-4 text-xs">
                {/* Transportadora */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transportadora Logística</label>
                  <select
                    value={formRecogida.carrier}
                    onChange={(e) => setFormRecogida({ ...formRecogida, carrier: e.target.value })}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#00a19a]"
                  >
                    <option value="coordinadora">Coordinadora Mercantil</option>
                    <option value="servientrega">Servientrega</option>
                    <option value="envia">Envía</option>
                    <option value="tcc">TCC</option>
                    <option value="interrapidisimo">Interrapidísimo</option>
                  </select>
                </div>

                {/* Fecha de Recogida */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha de Recolección en Taller</label>
                  <Input
                    type="date"
                    value={formRecogida.pickupDate}
                    onChange={(e) => setFormRecogida({ ...formRecogida, pickupDate: e.target.value })}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold"
                    required
                  />
                </div>

                {/* Rango de Horas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hora Desde</label>
                    <Input
                      type="time"
                      value={formRecogida.pickupTimeFrom}
                      onChange={(e) => setFormRecogida({ ...formRecogida, pickupTimeFrom: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hora Hasta</label>
                    <Input
                      type="time"
                      value={formRecogida.pickupTimeTo}
                      onChange={(e) => setFormRecogida({ ...formRecogida, pickupTimeTo: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Paquetes y Peso */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Total Paquetes</label>
                    <Input
                      type="number"
                      min={1}
                      value={formRecogida.totalPackages}
                      onChange={(e) => setFormRecogida({ ...formRecogida, totalPackages: parseInt(e.target.value) || 1 })}
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Peso Total (Kg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0.5}
                      value={formRecogida.totalWeight}
                      onChange={(e) => setFormRecogida({ ...formRecogida, totalWeight: parseFloat(e.target.value) || 1.0 })}
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold"
                    />
                  </div>
                </div>

                {/* Dirección de Origen (Fija) */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Punto de Recogida (Taller)</span>
                  <p className="font-black text-slate-900">Thiart 3D — Calle 5 #24A-152, Cali</p>
                  <p className="text-slate-500 font-medium">Tel: 3012906861 • Contacto: Luis Gotopo</p>
                </div>

                {/* Instrucciones */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Notas / Instrucciones para el Conductor</label>
                  <Input
                    type="text"
                    value={formRecogida.instructions}
                    onChange={(e) => setFormRecogida({ ...formRecogida, instructions: e.target.value })}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 font-medium"
                    placeholder="Ej: Timbrar en portería o taller segundo piso"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={programandoRecogida}
                  className="w-full h-12 bg-[#00a19a] hover:bg-[#007973] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-[#00a19a]/20 active:scale-95 transition-all"
                >
                  {programandoRecogida ? "Solicitando a la Transportadora..." : "📅 Confirmar y Programar Recogida"}
                </Button>
              </form>
            </div>

            {/* Historial de Recogidas Programadas */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-400" />
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Recogidas Programadas</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void fetchRecogidas()}
                  className="h-8 px-2 text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Actualizar
                </Button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recogidas.length === 0 ? (
                  <div className="py-12 text-center space-y-2 text-slate-400">
                    <CalendarIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold">No hay recogidas programadas</p>
                    <p className="text-[11px]">Usa el formulario lateral para solicitar tu primera recolección de paquetes.</p>
                  </div>
                ) : (
                  recogidas.map((r, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 uppercase">
                            {r.carrier}
                          </span>
                          <span className="text-[10px] font-black text-[#00a19a] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                            #{r.confirmation_number}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          {r.status || "Programada"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Fecha Recogida</span>
                          <span className="font-bold text-slate-800">{r.pickup_date}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Horario</span>
                          <span className="font-bold text-slate-800">{r.pickup_time_from} - {r.pickup_time_to}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Bultos / Peso</span>
                          <span className="font-bold text-slate-800">{r.total_packages} pqtes ({r.total_weight} kg)</span>
                        </div>
                      </div>

                      {r.instructions && (
                        <p className="text-[11px] text-slate-500 font-medium italic border-t border-slate-200/60 pt-1.5">
                          &ldquo;{r.instructions}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Modal Ficha Completa de Pedido & Guía */}
      <DetallePedidoModal
        pedido={pedidoDetalle}
        onClose={() => setPedidoDetalle(null)}
        onAprobarPago={() => {}}
        procesandoPago={null}
        onGuiaGenerada={fetchPedidos}
      />

      {/* Modal Idéntico de Recolecciones estilo Envía */}
      <RecoleccionesModal
        open={modalRecoleccionesOpen}
        onOpenChange={setModalRecoleccionesOpen}
        pedidosList={pedidos}
        onRecogidaExitosa={fetchRecogidas}
      />
    </div>
  );
}
