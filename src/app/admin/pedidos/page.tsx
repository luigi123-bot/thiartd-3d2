"use client";

import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { DetallePedidoModal } from "../../../components/DetallePedidoModal";
import {
  Download, Search, Filter,
  Clock, Package,
  FileText, Settings2, Mail, TrendingUp, Users, ArrowUpRight, Calendar, CheckCircle2, AlertTriangle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

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

type StatColor = "brand" | "amber" | "emerald" | "slate";

interface IconProps {
  className?: string;
  size?: number | string;
  stroke?: string | number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<IconProps>;
  color: StatColor;
  detail: string;
}

function StatCard({ title, value, icon: Icon, color, detail }: StatCardProps) {
  const colors: Record<StatColor, string> = {
    brand: "bg-[#00a19a] text-white shadow-[#00a19a]/20",
    amber: "bg-amber-500 text-white shadow-amber-500/20",
    emerald: "bg-emerald-600 text-white shadow-emerald-600/20",
    slate: "bg-slate-900 text-white shadow-slate-900/20",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl flex flex-col justify-between h-full group transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
          KPI
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{value}</p>
        <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          {detail}
        </p>
      </div>
    </motion.div>
  );
}

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
  const [procesandoPago, setProcesandoPago] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);

  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [managerEmail, setManagerEmail] = useState("");
  const [openConfig, setOpenConfig] = useState(false);

  // Estado para el diálogo de confirmación de pago manual
  const [confirmarPagoOpen, setConfirmarPagoOpen] = useState(false);
  const [pedidoAConfirmar, setPedidoAConfirmar] = useState<Pedido | null>(null);
  const [notaPago, setNotaPago] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado]);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching pedidos:", error);
    } else if (data) {
      setPedidos(data as Pedido[]);
    }
  };

  useEffect(() => {
    void fetchPedidos();
    // Cargar config actual
    fetch("/api/admin/configuraciones")
      .then(r => r.json())
      .then((d: unknown) => {
        const data = d as { valor?: string };
        setManagerEmail(data.valor ?? "");
      })
      .catch(console.error);
  }, []);

  const simularPagoAprobado = async (pedidoId: number) => {
    setProcesandoPago(pedidoId);
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId,
          estado: 'pagado',
          payment_id: `ADMIN-AUTH-${Date.now()}`,
          payment_method: 'MANUAL_OFFLINE',
        }),
      });

      if (response.ok) {
        await fetchPedidos();
        if (detallePedido?.id === pedidoId) {
          const { data, error } = (await supabase.from("pedidos").select("*").eq("id", pedidoId).single()) as unknown as { data: Pedido | null; error: Error | null };
          if (!error && data) setDetallePedido(data);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcesandoPago(null);
    }
  };

  const handleUpdateEmail = async () => {
    try {
      const resp = await fetch("/api/admin/configuraciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: managerEmail })
      });
      if (resp.ok) {
        alert("✅ Correo del gerente actualizado.");
        setOpenConfig(false);
      }
    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
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
        body: JSON.stringify({ managerEmail })
      });
      if (resp.ok) {
        alert(`📊 Reporte enviado a: ${managerEmail}`);
      } else {
        alert("Error al generar el reporte.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión.");
    } finally {
      setGenerandoReporte(false);
    }
  };

  const filteredPedidos = filtroEstado === "todos"
    ? pedidos
    : pedidos.filter(p => p.estado === filtroEstado);

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(filteredPedidos.length / ITEMS_PER_PAGE);
  const paginatedPedidos = filteredPedidos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Calcular estadísticas
  const totalIngresos = pedidos
    .filter(p => p.estado === 'pagado')
    .reduce((acc, p) => acc + Number(p.total), 0);

  const pendientesPago = pedidos.filter(p => p.estado === 'pendiente_pago').length;
  const totalPedidos = pedidos.length;
  const pagadosCount = pedidos.filter(p => p.estado === 'pagado').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
      <div className="max-w-[1920px] mx-auto space-y-10">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl">
                <Package className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Panel de Pedidos</h1>
            </div>
            <p className="text-slate-500 font-medium">Gestión inteligente de ventas y logística</p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente o ID..."
                className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#00a19a] outline-none shadow-sm transition-all text-sm font-bold"
              />
            </div>
            <Button
              className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl"
            >
              <Download className="w-5 h-5 mr-3" />
              Exportar
            </Button>
            <div className="flex items-center">
              <Button
                onClick={handleGenerarReporte}
                disabled={generandoReporte}
                className="h-10 px-4 rounded-l-md bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 border-r border-purple-500"
              >
                {generandoReporte ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Generar Reporte Gerencial</span>
                <span className="sm:hidden">Reporte</span>
              </Button>
              <Dialog open={openConfig} onOpenChange={setOpenConfig}>
                <DialogTrigger asChild>
                  <Button className="h-10 px-3 rounded-r-md bg-purple-600 hover:bg-purple-700 text-white border-l border-purple-500">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
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
                    <Button onClick={handleUpdateEmail} className="bg-[#00a19a]">Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ingresos Totales"
            value={`$${totalIngresos.toLocaleString('es-CO')}`}
            icon={TrendingUp as React.ComponentType<IconProps>}
            color="emerald"
            detail="Ventas aprobadas"
          />
          <StatCard
            title="Total Pedidos"
            value={totalPedidos}
            icon={Package as React.ComponentType<IconProps>}
            color="brand"
            detail={`${pagadosCount} completados`}
          />
          <StatCard
            title="Pendientes"
            value={pendientesPago}
            icon={Clock as React.ComponentType<IconProps>}
            color="amber"
            detail="Esperando pago"
          />
          <StatCard
            title="Tasa de Conversión"
            value={`${totalPedidos > 0 ? ((pagadosCount / totalPedidos) * 100).toFixed(1) : 0}%`}
            icon={Users as React.ComponentType<IconProps>}
            color="slate"
            detail="Pedidos vs Pagados"
          />
        </div>

        {/* ─── FUNNEL VISUAL DE ETAPAS (Req 12) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              key: "activo",
              label: "Pedido Activo",
              emoji: "📦",
              estados: ["pendiente_cotizacion", "pendiente_pago"],
              color: "from-amber-500 to-orange-500",
              bg: "bg-amber-50",
              border: "border-amber-200",
              text: "text-amber-700",
              dotColor: "bg-amber-500",
            },
            {
              key: "produccion",
              label: "Producción",
              emoji: "🔧",
              estados: ["pagado"],
              color: "from-blue-500 to-indigo-500",
              bg: "bg-blue-50",
              border: "border-blue-200",
              text: "text-blue-700",
              dotColor: "bg-blue-500",
            },
            {
              key: "transito",
              label: "En Tránsito",
              emoji: "🚚",
              estados: ["en_transito", "enviado"],
              color: "from-purple-500 to-violet-500",
              bg: "bg-purple-50",
              border: "border-purple-200",
              text: "text-purple-700",
              dotColor: "bg-purple-500",
            },
            {
              key: "entregado",
              label: "Entregados",
              emoji: "✅",
              estados: ["entregado", "completado"],
              color: "from-emerald-500 to-green-500",
              bg: "bg-emerald-50",
              border: "border-emerald-200",
              text: "text-emerald-700",
              dotColor: "bg-emerald-500",
            },
          ].map((stage) => {
            const count = pedidos.filter((p) => stage.estados.includes(p.estado)).length;
            const pct = pedidos.length > 0 ? Math.round((count / pedidos.length) * 100) : 0;
            const isSelected = stage.estados.some((e) => e === filtroEstado) || (filtroEstado === "todos" && stage.key === "activo");
            return (
              <motion.button
                key={stage.key}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFiltroEstado(stage.estados[0] ?? "todos")}
                className={`relative p-6 rounded-[28px] border-2 transition-all text-left overflow-hidden group ${
                  isSelected
                    ? `${stage.border} ${stage.bg} shadow-xl shadow-black/5 ring-2 ring-offset-2 ring-${stage.dotColor}`
                    : "bg-white border-slate-100 hover:border-slate-200 shadow-md"
                }`}
              >
                {/* Gradient bar top */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stage.color}`} />
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{stage.emoji}</span>
                  <div className={`${stage.bg} ${stage.text} ${stage.border} border px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                    {pct}%
                  </div>
                </div>
                
                <div className="text-3xl font-black text-slate-900 mb-1">{count}</div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{stage.label}</div>
                
                {/* Progress bar */}
                <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${stage.color} rounded-full`}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Main Content Card */}
        <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white ring-1 ring-slate-100">
          {/* Table Toolbar */}
          <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Filtrar por:</span>
              </div>
              <div className="flex gap-2">
                {["todos", "pendiente_cotizacion", "pendiente_pago", "pagado", "en_transito", "entregado", "pago_cancelado"].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setFiltroEstado(estado)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroEstado === estado
                      ? "bg-slate-900 text-white shadow-lg scale-105"
                      : "bg-white text-slate-500 border border-slate-200 hover:border-slate-900"
                      }`}
                  >
                    {estado.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-slate-400 font-bold">
              Mostrando <span className="text-slate-900">{filteredPedidos.length}</span> resultados
            </div>
          </div>


          {/* Custom Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-4 md:px-10 py-4 md:py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente & Referencia</th>
                  <th className="px-4 md:px-10 py-4 md:py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Destino & Fecha</th>
                  <th className="px-4 md:px-10 py-4 md:py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                  <th className="px-4 md:px-10 py-4 md:py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Inversión</th>
                  <th className="px-4 md:px-10 py-4 md:py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {paginatedPedidos.map((p, idx) => {
                    const datosContacto = (typeof p.datos_contacto === "string"
                      ? JSON.parse(p.datos_contacto)
                      : p.datos_contacto) as unknown as DatosContacto || {};

                    const pParsed = typeof p.productos === "string"
                      ? JSON.parse(p.productos) as Producto[]
                      : (p.productos as unknown as Producto[]) ?? [];

                    const estadoColors: Record<string, string> = {
                      pagado: "bg-emerald-50 text-emerald-700 border-emerald-100",
                      pendiente_pago: "bg-amber-50 text-amber-700 border-amber-100",
                      pendiente_cotizacion: "bg-orange-50 text-orange-700 border-orange-100",
                      pago_cancelado: "bg-rose-50 text-rose-700 border-rose-100",
                      pago_rechazado: "bg-rose-50 text-rose-700 border-rose-100",
                    };

                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-slate-50/80 transition-all group"
                      >
                        <td className="px-4 md:px-10 py-4 md:py-8">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                              {(datosContacto.nombre ?? 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5">
                                {datosContacto.nombre ?? 'Usuario Desconocido'}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#00a19a] uppercase tracking-tighter bg-[#00a19a]/10 px-2 py-0.5 rounded-md">
                                  ID #{p.id}
                                </span>
                                <span className="text-xs text-slate-400 font-bold">{datosContacto.email ?? '-'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-10 py-4 md:py-8">
                          <div className="text-sm font-black text-slate-900 leading-tight mb-1">
                            {p.ciudad_envio ?? '-'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(p.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-4 md:px-10 py-4 md:py-8">
                          <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${estadoColors[p.estado] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${p.estado === 'pagado' ? 'bg-emerald-500 animate-pulse' :
                              p.estado === 'pendiente_pago' ? 'bg-amber-500' : 'bg-rose-500'
                              }`} />
                            {p.estado.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 md:px-10 py-4 md:py-8 text-right">
                          <div className="text-2xl font-black text-slate-900 tracking-tighter">
                            ${Number(p.total).toLocaleString('es-CO')}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            {pParsed.length} ARTÍCULOS
                          </div>
                        </td>
                        <td className="px-4 md:px-10 py-4 md:py-8">
                          <div className="flex justify-center gap-3">
                            <Button
                              onClick={() => setDetallePedido(p)}
                              className="h-12 px-6 bg-white border-2 border-slate-100 hover:border-slate-900 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:shadow-lg active:scale-95"
                            >
                              Detalles
                            </Button>
                            {p.estado === 'pendiente_pago' && (
                              <Button
                                onClick={() => {
                                  setPedidoAConfirmar(p);
                                  setNotaPago("");
                                  setConfirmarPagoOpen(true);
                                }}
                                disabled={procesandoPago === p.id}
                                title="Aprobar pago manualmente"
                                className="h-12 w-12 bg-[#00a19a] hover:bg-[#00897B] text-white rounded-xl shadow-lg shadow-[#00a19a]/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                              >
                                {procesandoPago === p.id ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-5 h-5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-10 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200"
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                      currentPage === page
                        ? "bg-slate-900 text-white shadow-md scale-105"
                        : "bg-white text-slate-500 border border-slate-200 hover:border-slate-900"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200"
              >
                Siguiente
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* ── Diálogo de Confirmación de Pago Manual ── */}
      <Dialog open={confirmarPagoOpen} onOpenChange={setConfirmarPagoOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmar Aprobación de Pago
            </DialogTitle>
          </DialogHeader>

          {pedidoAConfirmar && (
            <div className="py-2 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 font-medium">
                Estás a punto de marcar el pedido{" "}
                <span className="font-black">#{pedidoAConfirmar.id}</span> como{" "}
                <span className="font-black text-emerald-700">PAGADO</span> manualmente.
                <br />
                <span className="text-xs text-amber-600 mt-1 block">
                  Esta acción enviará el correo de confirmación al cliente y generará la guía de envío.
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Cliente:</span>
                  <span className="text-slate-800 font-black">
                    {(() => {
                      try {
                        const c = typeof pedidoAConfirmar.datos_contacto === "string"
                          ? JSON.parse(pedidoAConfirmar.datos_contacto) as DatosContacto
                          : pedidoAConfirmar.datos_contacto as unknown as DatosContacto;
                        return c?.nombre ?? "-";
                      } catch { return "-"; }
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Total:</span>
                  <span className="text-slate-800 font-black">${Number(pedidoAConfirmar.total).toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  Nota / Motivo (opcional)
                </label>
                <Input
                  placeholder="Ej: Cliente envió comprobante de transferencia"
                  value={notaPago}
                  onChange={(e) => setNotaPago(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmarPagoOpen(false)}
              className="rounded-xl border-slate-200 text-slate-600 font-bold"
            >
              Cancelar
            </Button>
            <Button
              disabled={procesandoPago === pedidoAConfirmar?.id}
              onClick={async () => {
                if (!pedidoAConfirmar) return;
                setConfirmarPagoOpen(false);
                await simularPagoAprobado(pedidoAConfirmar.id);
                setPedidoAConfirmar(null);
                setNotaPago("");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-2"
            >
              {procesandoPago === pedidoAConfirmar?.id ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Sí, aprobar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detail */}
      <DetallePedidoModal
        pedido={detallePedido}
        onClose={() => setDetallePedido(null)}
        onAprobarPago={simularPagoAprobado}
        procesandoPago={procesandoPago}
      />
    </div>
  );
}
