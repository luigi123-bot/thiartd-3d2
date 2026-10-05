"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { DetallePedidoModal } from "../../../components/DetallePedidoModal";
import RecoleccionesModal from "../../../components/RecoleccionesModal";
import {
  Download, Search,
  FileText, Settings2, Mail, CheckCircle2, AlertTriangle,
  Clock, Truck, MapPin, Check,
  ChevronRight, ChevronLeft, ArrowRight, Printer, Cpu, Layers, Box
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Pedido {
  id: number;
  cliente_id: string;
  estado: string;
  created_at: string;
  total: number;
  subtotal?: number;
  costo_envio?: number;
  tipo_entrega?: "envio" | "recoleccion";
  es_pod?: boolean;
  etapa_kanban?: number; // 1: Por procesar, 2: Fabricación POD, 3: Listo / Por recoger, 4: Entregado
  fecha_estimada_lista?: string;
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
}

interface Producto {
  id?: string;
  nombre?: string;
  name?: string;
  cantidad: number;
  precio_unitario?: number;
  precio?: number;
  es_pod?: boolean;
  escala?: string;
  estilo?: string;
}

interface DatosContacto {
  nombre?: string;
  email?: string;
  telefono?: string;
}

const ETAPAS = [
  {
    id: 1,
    titulo: "Por Procesar",
    subtitulo: "Nuevos y por confirmar",
    color: "border-amber-400 bg-amber-50/40 text-amber-900",
    badgeColor: "bg-amber-100 text-amber-800",
    dotColor: "bg-amber-500",
  },
  {
    id: 2,
    titulo: "En Fabricación (POD)",
    subtitulo: "Impresión 3D & Pintura",
    color: "border-blue-400 bg-blue-50/40 text-blue-900",
    badgeColor: "bg-blue-100 text-blue-800",
    dotColor: "bg-blue-500",
  },
  {
    id: 3,
    titulo: "Listo Entrega / Por Recoger",
    subtitulo: "Stock físico o empaque listo",
    color: "border-purple-400 bg-purple-50/40 text-purple-900",
    badgeColor: "bg-purple-100 text-purple-800",
    dotColor: "bg-purple-500",
  },
  {
    id: 4,
    titulo: "Entregado / En Ruta",
    subtitulo: "Despachado o retirado",
    color: "border-emerald-400 bg-emerald-50/40 text-emerald-900",
    badgeColor: "bg-emerald-100 text-emerald-800",
    dotColor: "bg-emerald-500",
  },
];

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
  const [procesandoPago, setProcesandoPago] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "envio" | "recoleccion" | "pod">("todos");

  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [managerEmail, setManagerEmail] = useState("");
  const [openConfig, setOpenConfig] = useState(false);

  // Drag and Drop state
  const [draggedPedidoId, setDraggedPedidoId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);

  // Diálogo de confirmación manual
  const [confirmarPagoOpen, setConfirmarPagoOpen] = useState(false);
  const [pedidoAConfirmar, setPedidoAConfirmar] = useState<Pedido | null>(null);
  const [openRecolecciones, setOpenRecolecciones] = useState(false);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pedidos:", error);
    } else if (data) {
      setPedidos(data as Pedido[]);
    }
  };

  useEffect(() => {
    void fetchPedidos();
    fetch("/api/admin/configuraciones")
      .then((r) => r.json())
      .then((d: unknown) => {
        const data = d as { valor?: string };
        setManagerEmail(data.valor ?? "");
      })
      .catch(console.error);
  }, []);

  // Mover pedido de etapa (Kanban Drag & Drop o Botón)
  const moverEtapa = async (pedidoId: number, nuevaEtapa: number) => {
    try {
      // Optimistic update
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, etapa_kanban: nuevaEtapa } : p))
      );

      const res = await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId,
          etapa_kanban: nuevaEtapa,
          estado:
            nuevaEtapa === 1
              ? "pendiente_pago"
              : nuevaEtapa === 2
              ? "en_produccion"
              : nuevaEtapa === 3
              ? "listo_entrega"
              : "completado",
        }),
      });

      if (res.ok) {
        toast.success(`Pedido #${pedidoId} movido a Etapa ${nuevaEtapa} (${ETAPAS.find(e => e.id === nuevaEtapa)?.titulo})`);
        void fetchPedidos();
      } else {
        toast.error("Error al actualizar la etapa");
        void fetchPedidos();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
      void fetchPedidos();
    }
  };

  const simularPagoAprobado = async (pedidoId: number) => {
    setProcesandoPago(pedidoId);
    try {
      const pedidoObj = pedidos.find((p) => p.id === pedidoId);
      const esPOD = Boolean(pedidoObj?.es_pod);
      // Regla 1: Si tiene stock, no pasa por impresión -> directo a Etapa 3 (Listo / Por recoger)
      // Si es POD, pasa a Etapa 2 (En Fabricación POD)
      const etapaDestino = esPOD ? 2 : 3;

      const response = await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId,
          estado: "pagado",
          etapa_kanban: etapaDestino,
          payment_id: `ADMIN-MANUAL-${Date.now()}`,
          payment_method: "MANUAL_OFFLINE",
        }),
      });

      if (response.ok) {
        if (esPOD) {
          toast.success(`Pedido #${pedidoId} aprobado: Modo POD en fabricación. Recolección Envía programada.`);
        } else {
          toast.success(`Pedido #${pedidoId} aprobado: Producto en stock, colocado en 'Por Recoger / Listo Entrega' (Etapa 3).`);
        }
        await fetchPedidos();
        if (detallePedido?.id === pedidoId) {
          const { data } = await supabase.from("pedidos").select("*").eq("id", pedidoId).single();
          if (data) setDetallePedido(data as Pedido);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al aprobar pago");
    } finally {
      setProcesandoPago(null);
    }
  };

  const handleGenerarReporte = async () => {
    if (!managerEmail) {
      setOpenConfig(true);
      return;
    }
    setGenerandoReporte(true);
    try {
      const resp = await fetch("/api/admin/reporte-gerencial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerEmail }),
      });
      if (resp.ok) {
        toast.success(`Reporte gerencial enviado a ${managerEmail}`);
      } else {
        toast.error("Error al generar el reporte");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGenerandoReporte(false);
    }
  };

  // Filtrado de pedidos
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      let matchSearch = true;
      if (searchTerm) {
        let contacto: DatosContacto = {};
        try {
          contacto = typeof p.datos_contacto === "string" ? JSON.parse(p.datos_contacto) : p.datos_contacto || {};
        } catch {
          // ignore
        }
        const str = `${p.id} ${contacto.nombre ?? ""} ${contacto.email ?? ""} ${p.ciudad_envio ?? ""}`.toLowerCase();
        matchSearch = str.includes(searchTerm.toLowerCase());
      }

      let matchTipo = true;
      if (filtroTipo === "envio") matchTipo = p.tipo_entrega !== "recoleccion";
      if (filtroTipo === "recoleccion") matchTipo = p.tipo_entrega === "recoleccion";
      if (filtroTipo === "pod") matchTipo = Boolean(p.es_pod);

      return matchSearch && matchTipo;
    });
  }, [pedidos, searchTerm, filtroTipo]);

  // Agrupar pedidos por etapa (1, 2, 3, 4)
  const pedidosPorEtapa = useMemo(() => {
    const etapasMap: Record<number, Pedido[]> = { 1: [], 2: [], 3: [], 4: [] };
    pedidosFiltrados.forEach((p) => {
      let etapa = p.etapa_kanban ?? 1;
      // Fallback si no tiene etapa asignada pero tiene estado
      if (!p.etapa_kanban) {
        if (p.estado === "pagado" || p.estado === "en_produccion") etapa = 2;
        else if (p.estado === "listo_entrega" || p.estado === "en_transito") etapa = 3;
        else if (p.estado === "entregado" || p.estado === "completado") etapa = 4;
        else etapa = 1;
      }
      if (etapa < 1) etapa = 1;
      if (etapa > 4) etapa = 4;
      etapasMap[etapa]?.push(p);
    });
    return etapasMap;
  }, [pedidosFiltrados]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-[1920px] mx-auto space-y-6">
        
        {/* ── Top Bar / Header ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestor de Órdenes</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Flujo de 4 Etapas: Recepción $\rightarrow$ Fabricación POD $\rightarrow$ Empaque/Envía $\rightarrow$ Entrega
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente, ID, ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white outline-none focus:ring-2 focus:ring-[#00a19a]"
              />
            </div>

            {/* Filtros tipo (Sin emojis) */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl">
              {(
                [
                  { key: "todos", label: "Todos" },
                  { key: "envio", label: "Envíos" },
                  { key: "recoleccion", label: "Recogida" },
                  { key: "pod", label: "Print on Demand" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltroTipo(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition-all ${
                    filtroTipo === f.key
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Botón Solicitar Recolección */}
            <Button
              onClick={() => setOpenRecolecciones(true)}
              className="h-11 px-4 rounded-2xl bg-[#1877f2] hover:bg-[#1565c0] text-white font-bold text-xs flex items-center gap-2 shadow-md"
            >
              <Truck className="w-4 h-4" />
              <span>Recolecciones</span>
            </Button>

            {/* Botón Reporte */}
            <div className="flex items-center">
              <Button
                onClick={handleGenerarReporte}
                disabled={generandoReporte}
                className="h-11 px-4 rounded-l-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Reporte</span>
              </Button>
              <Dialog open={openConfig} onOpenChange={setOpenConfig}>
                <DialogTrigger asChild>
                  <Button className="h-11 px-3 rounded-r-2xl bg-purple-600 hover:bg-purple-700 text-white border-l border-purple-500">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" /> Configurar Correo Gerencial
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <Input
                      placeholder="correo@gerente.com"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setOpenConfig(false)} className="bg-[#00a19a]">Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* ── Tablero Kanban Drag & Drop (Drop and Pull) de 4 Etapas ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {ETAPAS.map((etapa) => {
            const lista = pedidosPorEtapa[etapa.id] ?? [];
            const isOver = dragOverCol === etapa.id;

            return (
              <div
                key={etapa.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverCol !== etapa.id) {
                    setDragOverCol(etapa.id);
                  }
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDragOverCol(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  const dataId = e.dataTransfer.getData("text/plain");
                  const idToMove = draggedPedidoId ?? (dataId ? Number(dataId) : null);
                  if (idToMove !== null && !isNaN(idToMove)) {
                    void moverEtapa(idToMove, etapa.id);
                    setDraggedPedidoId(null);
                  }
                }}
                className={`bg-white rounded-3xl p-4 border-2 transition-all min-h-[680px] flex flex-col shadow-sm ${
                  isOver ? "border-[#00a19a] ring-4 ring-[#00a19a]/15 bg-teal-50/20 scale-[1.01]" : "border-slate-100"
                }`}
              >
                {/* Header de la columna */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${etapa.dotColor}`} />
                    <div>
                      <h3 className="font-black text-sm text-slate-900">{etapa.titulo}</h3>
                      <p className="text-[10px] text-slate-400 font-bold">{etapa.subtitulo}</p>
                    </div>
                  </div>
                  <span className="w-7 h-7 rounded-xl bg-slate-100 font-black text-xs text-slate-700 flex items-center justify-center">
                    {lista.length}
                  </span>
                </div>

                {/* Zona de Drop Activa Visual */}
                {isOver && draggedPedidoId && (
                  <div className="mb-3 p-3.5 border-2 border-dashed border-[#00a19a] bg-teal-50/80 rounded-2xl text-center text-xs font-black text-[#00a19a] animate-pulse">
                    Soltar Pedido #{draggedPedidoId} en &quot;{etapa.titulo}&quot;
                  </div>
                )}

                {/* Lista de Tarjetas (Arrastrables con Drop and Pull) */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {lista.length === 0 ? (
                    <div className="h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <p className="text-xs font-bold">Sin órdenes en esta etapa</p>
                      <p className="text-[10px] mt-1 text-slate-400">Arrastra una tarjeta aquí</p>
                    </div>
                  ) : (
                    lista.map((p) => {
                      let contacto: DatosContacto = {};
                      try {
                        contacto = typeof p.datos_contacto === "string" ? JSON.parse(p.datos_contacto) : p.datos_contacto || {};
                      } catch {
                        // ignore
                      }

                      let productosList: Producto[] = [];
                      try {
                        productosList = typeof p.productos === "string" ? JSON.parse(p.productos) : p.productos || [];
                      } catch {
                        // ignore
                      }

                      const esRecogida = p.tipo_entrega === "recoleccion";
                      const esPOD = Boolean(p.es_pod);
                      const isBeingDragged = draggedPedidoId === p.id;

                      return (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedPedidoId(p.id);
                            e.dataTransfer.setData("text/plain", String(p.id));
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDraggedPedidoId(null);
                            setDragOverCol(null);
                          }}
                          className={`bg-slate-50 hover:bg-white p-4 rounded-2xl border transition-all cursor-grab active:cursor-grabbing group select-none space-y-3 shadow-sm ${
                            isBeingDragged
                              ? "opacity-30 scale-95 border-dashed border-[#00a19a] bg-teal-50/40"
                              : "border-slate-200 hover:border-slate-900"
                          }`}
                        >
                          {/* Top Card Info */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-[#00a19a] bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                              #{p.id}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Date(p.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                            </span>
                          </div>

                          {/* Cliente & Total */}
                          <div>
                            <h4 className="font-black text-slate-900 text-sm line-clamp-1">
                              {contacto.nombre || "Cliente"}
                            </h4>
                            <p className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                              ${Number(p.total).toLocaleString("es-CO")}{" "}
                              <span className="text-[10px] font-bold text-slate-400">COP</span>
                            </p>
                          </div>

                          {/* Badges de Tipo & POD (Sin emojis) */}
                          <div className="flex flex-wrap gap-1.5">
                            {esRecogida ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100/80 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                                <MapPin className="w-3 h-3" /> Recogida Taller
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-blue-100/80 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                                <Truck className="w-3 h-3" /> Envío a {p.ciudad_envio || "Domicilio"}
                              </span>
                            )}

                            {esPOD && (
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                                <Printer className="w-3 h-3" /> Print on Demand
                              </span>
                            )}
                          </div>

                          {/* Fecha estimada de lista / Recolección POD */}
                          {esPOD && p.fecha_estimada_lista && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 bg-teal-50/80 px-2 py-1 rounded-lg border border-teal-100">
                              <Clock className="w-3 h-3 text-[#00a19a]" />
                              <span>Envía Recolección: {new Date(p.fecha_estimada_lista).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })} (09:00 - 17:00)</span>
                            </div>
                          )}

                          {/* Resumen productos */}
                          <div className="text-[11px] text-slate-500 font-medium line-clamp-2 border-t border-slate-200/60 pt-2">
                            {productosList.map((pr) => `${pr.cantidad}x ${pr.nombre || pr.name}`).join(", ")}
                          </div>

                          {/* Botones de acción rápida & detalles */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => setDetallePedido(p)}
                              className="text-[11px] font-black text-slate-700 hover:text-[#00a19a] underline"
                            >
                              Ver detalles
                            </button>

                            <div className="flex items-center gap-1">
                              {/* Botón aprobar pago si está pendiente */}
                              {p.estado === "pendiente_pago" && etapa.id === 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPedidoAConfirmar(p);
                                    setConfirmarPagoOpen(true);
                                  }}
                                  className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Aprobar
                                </button>
                              )}

                              {/* Flechas para mover en mobile o touch */}
                              {etapa.id > 1 && (
                                <button
                                  type="button"
                                  onClick={() => moverEtapa(p.id, etapa.id - 1)}
                                  className="w-7 h-7 bg-white hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700"
                                  title="Retroceder etapa"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {etapa.id < 4 && (
                                <button
                                  type="button"
                                  onClick={() => moverEtapa(p.id, etapa.id + 1)}
                                  className="w-7 h-7 bg-slate-900 hover:bg-[#00a19a] rounded-lg text-white flex items-center justify-center"
                                  title="Avanzar etapa"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Confirmación de Pago Manual */}
      <Dialog open={confirmarPagoOpen} onOpenChange={setConfirmarPagoOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmar Pago Manual
            </DialogTitle>
          </DialogHeader>

          {pedidoAConfirmar && (
            <div className="py-2 space-y-4 text-xs font-semibold text-slate-700">
              <p>
                ¿Deseas marcar el pedido <strong>#{pedidoAConfirmar.id}</strong> como <strong>PAGADO</strong>?
              </p>
              <p className="text-slate-500">
                Se enviará automáticamente el correo de factura al cliente y el pedido avanzará a la Etapa 2 (Fabricación / Revisión).
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmarPagoOpen(false)} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button
              disabled={procesandoPago === pedidoAConfirmar?.id}
              onClick={async () => {
                if (!pedidoAConfirmar) return;
                setConfirmarPagoOpen(false);
                await simularPagoAprobado(pedidoAConfirmar.id);
                setPedidoAConfirmar(null);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black"
            >
              {procesandoPago === pedidoAConfirmar?.id ? "Aprobando..." : "Sí, Aprobar Pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle de Pedido */}
      <DetallePedidoModal
        pedido={detallePedido}
        onClose={() => setDetallePedido(null)}
        onAprobarPago={simularPagoAprobado}
        procesandoPago={procesandoPago}
      />

      {/* Modal de Recolecciones estilo Envía */}
      <RecoleccionesModal
        open={openRecolecciones}
        onOpenChange={setOpenRecolecciones}
        pedidosList={pedidos}
        onRecogidaExitosa={fetchPedidos}
      />
    </div>
  );
}
