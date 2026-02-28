"use client";

import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { DetallePedidoModal } from "../../../components/DetallePedidoModal";
import {
  Package,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Calendar,
  Users,
  ArrowUpRight
} from "lucide-react";
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

  const filteredPedidos = filtroEstado === "todos"
    ? pedidos
    : pedidos.filter(p => p.estado === filtroEstado);

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
            <Button className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl">
              <Download className="w-5 h-5 mr-3" />
              Exportar
            </Button>
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
                {["todos", "pendiente_pago", "pagado", "pago_cancelado"].map((estado) => (
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
                  <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente & Referencia</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Destino & Fecha</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                  <th className="px-10 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Inversión</th>
                  <th className="px-10 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {filteredPedidos.map((p, idx) => {
                    const datosContacto = (typeof p.datos_contacto === "string"
                      ? JSON.parse(p.datos_contacto)
                      : p.datos_contacto) as unknown as DatosContacto || {};

                    const pParsed = typeof p.productos === "string"
                      ? JSON.parse(p.productos) as Producto[]
                      : (p.productos as unknown as Producto[]) ?? [];

                    const estadoColors: Record<string, string> = {
                      pagado: "bg-emerald-50 text-emerald-700 border-emerald-100",
                      pendiente_pago: "bg-amber-50 text-amber-700 border-amber-100",
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
                        <td className="px-10 py-8">
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
                        <td className="px-10 py-8">
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
                        <td className="px-10 py-8">
                          <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${estadoColors[p.estado] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${p.estado === 'pagado' ? 'bg-emerald-500 animate-pulse' :
                              p.estado === 'pendiente_pago' ? 'bg-amber-500' : 'bg-rose-500'
                              }`} />
                            {p.estado.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="text-2xl font-black text-slate-900 tracking-tighter">
                            ${Number(p.total).toLocaleString('es-CO')}
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            {pParsed.length} ARTÍCULOS
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex justify-center gap-3">
                            <Button
                              onClick={() => setDetallePedido(p)}
                              className="h-12 px-6 bg-white border-2 border-slate-100 hover:border-slate-900 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:shadow-lg active:scale-95"
                            >
                              Detalles
                            </Button>
                            {p.estado === 'pendiente_pago' && (
                              <Button
                                onClick={() => simularPagoAprobado(p.id)}
                                disabled={procesandoPago === p.id}
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
        </Card>
      </div>

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
