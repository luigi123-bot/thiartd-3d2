"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "~/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, Users, Package, 
  Bell, Download, FileText, 
  DollarSign, ArrowUpRight, Mail, RefreshCw,
  ShoppingCart, Truck, Calendar, ChevronRight,
  Sparkles, Layers
} from "lucide-react";

interface ResumenBI {
  totalIngresos: number;
  totalPedidos: number;
  pedidosConfirmados: number;
  ticketPromedio: number;
  totalUsuarios: number;
  totalProductos: number;
  productosStockBajo: number;
  totalCarritos: number;
  potencialCarritos: number;
  totalRecogidas: number;
  totalMensajes: number;
  mensajesNoLeidos: number;
  totalNotificaciones: number;
  enviosCount: number;
  recoleccionCount: number;
}

interface VentaMes {
  mes: string;
  label: string;
  total: number;
  pedidos: number;
}

interface UsuarioMes {
  mes: string;
  label: string;
  nuevos: number;
  acumulado: number;
}

interface PedidoEstado {
  estado: string;
  label: string;
  count: number;
  color: string;
}

interface TopProducto {
  nombre: string;
  categoria: string;
  cantidad: number;
  total: number;
  imagen?: string;
}

interface PedidoReciente {
  id: number;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  total: number;
  estado: string;
  tipoEntrega: string;
  fecha: string;
  esPod: boolean;
}

interface BIData {
  resumen: ResumenBI;
  ventasPorMes: VentaMes[];
  usuariosPorMes: UsuarioMes[];
  pedidosPorEstado: PedidoEstado[];
  topProductos: TopProducto[];
  productosPorCategoria: { categoria: string; value: number }[];
  pedidosRecientes: PedidoReciente[];
}

const RANGES = [
  { id: "all", label: "Histórico Completo" },
  { id: "year", label: "Este Año" },
  { id: "90d", label: "Últimos 90 Días" },
  { id: "30d", label: "Últimos 30 Días" },
];

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<BIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Modal reporte gerencial
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [managerEmail, setManagerEmail] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMetrics = useCallback(async (selectedRange: string) => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/admin/bi-metrics?range=${selectedRange}`);
      if (!res.ok) throw new Error("Error fetching BI metrics");
      const json = (await res.json()) as BIData;
      setData(json);
    } catch (err) {
      console.error("Error al cargar BI:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      void fetchMetrics(range);
    }
  }, [range, fetchMetrics, mounted]);

  useEffect(() => {
    if (mounted) {
      fetch("/api/admin/configuraciones")
        .then(r => r.json())
        .then((d: unknown) => {
          const conf = d as { valor?: string };
          const val = conf.valor ?? "";
          setManagerEmail(val);
          setTempEmail(val);
        })
        .catch(console.error);
    }
  }, [mounted]);

  const openSendReportDialog = () => {
    setTempEmail(managerEmail);
    setSaveAsDefault(false);
    setReportModalOpen(true);
  };

  const handleGenerarReporte = async () => {
    if (!tempEmail.trim()) {
      alert("Por favor introduce un correo válido.");
      return;
    }
    setGenerandoReporte(true);
    try {
      if (saveAsDefault && tempEmail !== managerEmail) {
        await fetch("/api/admin/configuraciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor: tempEmail })
        });
        setManagerEmail(tempEmail);
      }

      const resp = await fetch("/api/admin/reporte-gerencial", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerEmail: tempEmail }) 
      });
      if (resp.ok) {
        alert(`📊 Reporte ejecutivo enviado exitosamente a: ${tempEmail}`);
        setReportModalOpen(false);
      } else {
        const d = (await resp.json()) as { error?: string };
        alert(d.error ?? "Error al procesar el reporte.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al enviar reporte.");
    } finally {
      setGenerandoReporte(false);
    }
  };

  const exportarCSVCompleto = () => {
    if (!data) return;
    const { resumen, ventasPorMes, topProductos, pedidosRecientes } = data;

    let csv = "BUSINESS INTELLIGENCE - THIART 3D\n";
    csv += `Generado el: ${new Date().toISOString()}\n\n`;

    csv += "--- RESUMEN EJECUTIVO ---\n";
    csv += `Ingresos Confirmados (COP),${resumen.totalIngresos}\n`;
    csv += `Total Pedidos,${resumen.totalPedidos}\n`;
    csv += `Pedidos Confirmados/Pagados,${resumen.pedidosConfirmados}\n`;
    csv += `Ticket Promedio (COP),${resumen.ticketPromedio}\n`;
    csv += `Clientes Registrados,${resumen.totalUsuarios}\n`;
    csv += `Carritos Activos,${resumen.totalCarritos}\n`;
    csv += `Potencial en Carritos (COP),${resumen.potencialCarritos}\n`;
    csv += `Recogidas Envia Programadas,${resumen.totalRecogidas}\n\n`;

    csv += "--- VENTAS POR MES ---\n";
    csv += "Mes,Total Ventas (COP),Cantidad Pedidos\n";
    ventasPorMes.forEach(v => {
      csv += `${v.label},${v.total},${v.pedidos}\n`;
    });
    csv += "\n";

    csv += "--- PRODUCTOS MAS VENDIDOS ---\n";
    csv += "Producto,Categoria,Unidades Vendidas,Facturacion (COP)\n";
    topProductos.forEach(tp => {
      csv += `"${tp.nombre.replace(/"/g, '""')}",${tp.categoria},${tp.cantidad},${tp.total}\n`;
    });
    csv += "\n";

    csv += "--- HISTORIAL RECIENTE DE PEDIDOS ---\n";
    csv += "ID Pedido,Cliente,Telefono,Estado,Tipo Entrega,Total (COP),Fecha\n";
    pedidosRecientes.forEach(p => {
      csv += `#${p.id},"${p.clienteNombre}",${p.clienteTelefono},${p.estado},${p.tipoEntrega},${p.total},${p.fecha}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bi-reporte-thiart3d-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCOP = (val: number) => {
    return `$${Number(val || 0).toLocaleString("es-CO")} COP`;
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "listo_entrega":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "pagado":
      case "completado":
      case "entregado":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "en_produccion":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "en_transito":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "pendiente_pago":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // SSR Safe Loading Shell
  if (!mounted) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 bg-[#F8FAFC]">
        <div className="max-w-[1600px] mx-auto space-y-8 animate-pulse">
          <div className="h-16 bg-slate-200/70 rounded-2xl w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[360px] bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm" />
            <div className="h-[360px] bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Superior con Filtros y Acciones */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00a19a]/10 rounded-2xl text-[#00a19a]">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                  Business <span className="text-[#00a19a]">Intelligence</span>
                  <span className="text-[10px] tracking-widest font-black uppercase px-2.5 py-1 rounded-full bg-[#00a19a] text-white">
                    Live
                  </span>
                </h1>
                <p className="text-slate-500 font-medium text-sm mt-0.5">
                  Métricas de facturación real, logística, catálogo y comportamiento de clientes
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Rango de Fechas */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <Calendar className="w-4 h-4 ml-2.5 mr-1 text-slate-400" />
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    range === r.id
                      ? "bg-[#00a19a] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Botón Refrescar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchMetrics(range)}
              disabled={refreshing}
              className="h-10 px-3.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#00a19a]" : ""}`} />
            </Button>

            {/* Exportar CSV */}
            <Button 
              variant="outline"
              onClick={exportarCSVCompleto} 
              disabled={loading || !data}
              className="h-10 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 shadow-sm flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4 text-[#00a19a]" />
              Exportar CSV
            </Button>
            
            {/* Modal Enviar Reporte */}
            <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
              <Button 
                onClick={openSendReportDialog}
                className="h-10 px-5 rounded-xl bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800 transition-all flex items-center gap-2 text-sm"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                Enviar Reporte
              </Button>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#00a19a]" />
                    Enviar Informe Ejecutivo por Correo
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-sm text-slate-500">
                    Se enviará un resumen de ventas, métricas operativas y catálogo completo al correo indicado.
                  </p>
                  <Input 
                    type="email"
                    placeholder="correo@gerente.com" 
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    className="h-11 rounded-lg"
                  />

                  {tempEmail.trim() !== managerEmail && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <input 
                        type="checkbox" 
                        id="saveDefaultReportEmail" 
                        checked={saveAsDefault} 
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#00a19a] focus:ring-[#00a19a]"
                      />
                      <label htmlFor="saveDefaultReportEmail" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                        Guardar como destinatario predeterminado
                      </label>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline"
                    className="rounded-lg h-11"
                    onClick={() => setReportModalOpen(false)}
                    disabled={generandoReporte}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleGenerarReporte} 
                    disabled={generandoReporte || !tempEmail.trim()}
                    className="bg-[#00a19a] hover:bg-[#007973] font-bold rounded-lg h-11 flex items-center gap-2 text-white"
                  >
                    {generandoReporte ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {generandoReporte ? "Enviando..." : "Enviar Reporte"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 1. Tarjetas Principales de KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            title="Ingresos Confirmados" 
            value={formatCOP(data?.resumen.totalIngresos ?? 0)} 
            sub={`${data?.resumen.pedidosConfirmados ?? 0} pedidos confirmados`}
            icon={<DollarSign className="w-6 h-6" />}
            color="emerald"
            badge="Facturación Real"
            loading={loading}
          />
          <StatCard 
            title="Ticket Promedio (AOV)" 
            value={formatCOP(data?.resumen.ticketPromedio ?? 0)} 
            sub="Valor promedio por pedido"
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
            badge="Rendimiento"
            loading={loading}
          />
          <StatCard 
            title="Total Pedidos" 
            value={`${data?.resumen.totalPedidos ?? 0}`} 
            sub={`${data?.resumen.pedidosConfirmados ?? 0} confirmados en el flujo`}
            icon={<Package className="w-6 h-6" />}
            color="purple"
            badge="Operaciones"
            loading={loading}
          />
          <StatCard 
            title="Clientes Registrados" 
            value={`${data?.resumen.totalUsuarios ?? 0}`} 
            sub="Base de usuarios activa"
            icon={<Users className="w-6 h-6" />}
            color="indigo"
            badge="Comunidad"
            loading={loading}
          />
        </div>

        {/* Banner Operativo Secundario */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="flex items-center gap-3 p-2">
            <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Recogidas Envia</p>
              <p className="text-lg font-black text-slate-900">{data?.resumen.totalRecogidas ?? 0} <span className="text-xs font-normal text-slate-500">programadas</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 border-l border-slate-100">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Carritos Activos</p>
              <p className="text-lg font-black text-slate-900">
                {data?.resumen.totalCarritos ?? 0} 
                <span className="text-xs font-bold text-amber-600 ml-1.5">({formatCOP(data?.resumen.potencialCarritos ?? 0)})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 border-l border-slate-100">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Catálogo Activo</p>
              <p className="text-lg font-black text-slate-900">
                {data?.resumen.totalProductos ?? 0} <span className="text-xs font-normal text-slate-500">productos</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 border-l border-slate-100">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Alertas / Mensajes</p>
              <p className="text-lg font-black text-slate-900">
                {data?.resumen.totalNotificaciones ?? 0} <span className="text-xs font-normal text-slate-500">alertas</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Sección Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Facturación Mensual */}
          <Card className="p-6 rounded-[24px] border-slate-200/80 shadow-sm bg-white overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00a19a]" />
                  <h3 className="text-lg font-bold text-slate-800">
                    Facturación por Mes
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ventas confirmadas
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Ingresos mensuales obtenidos de órdenes con pago acreditado.
              </p>
            </div>

            <div className="h-[280px] w-full">
              {data && data.ventasPorMes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ventasPorMes} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: "#94a3b8" }} 
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(val: number) => [formatCOP(val), "Ingresos"]}
                      labelFormatter={(label: string) => `Período: ${label}`}
                      contentStyle={{ 
                        borderRadius: "14px", 
                        border: "1px solid #e2e8f0", 
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        backgroundColor: "#ffffff",
                        padding: "10px 14px",
                        fontSize: "12px",
                        fontWeight: 600
                      }}
                    />
                    <Bar dataKey="total" fill="#00a19a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400 font-medium">
                  {loading ? "Cargando gráfica de ventas..." : "Sin ventas registradas en este período."}
                </div>
              )}
            </div>
          </Card>

          {/* Crecimiento de Usuarios Acumulado */}
          <Card className="p-6 rounded-[24px] border-slate-200/80 shadow-sm bg-white overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <h3 className="text-lg font-bold text-slate-800">
                    Crecimiento de Clientes
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Acumulado
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Evolución cronológica de nuevos registros de usuarios en la plataforma.
              </p>
            </div>

            <div className="h-[280px] w-full">
              {data && data.usuariosPorMes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.usuariosPorMes} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: "#94a3b8" }} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(val: number) => [`${val} usuarios`, "Total Registrados"]}
                      labelFormatter={(label: string) => `Mes: ${label}`}
                      contentStyle={{ 
                        borderRadius: "14px", 
                        border: "1px solid #e2e8f0", 
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        backgroundColor: "#ffffff",
                        padding: "10px 14px",
                        fontSize: "12px",
                        fontWeight: 600
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="acumulado" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#userGrowthGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400 font-medium">
                  {loading ? "Cargando gráfica de usuarios..." : "Sin datos de usuarios disponibles."}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 3. Fila de Desglose Operacional y Productos Más Vendidos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Top Productos Más Vendidos */}
          <Card className="lg:col-span-2 p-6 rounded-[24px] border-slate-200/80 shadow-sm bg-white overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Productos Más Vendidos (Ranking)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Artículos con mayor demanda y facturación generada
                </p>
              </div>
              <Link 
                href="/admin/productos" 
                className="text-xs font-bold text-[#00a19a] hover:underline flex items-center gap-1"
              >
                Ver Catálogo <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data && data.topProductos.length > 0 ? (
              <div className="space-y-4">
                {data.topProductos.map((prod, idx) => {
                  const maxTotal = data.topProductos[0]?.total || 1;
                  const percent = Math.min(100, Math.round((prod.total / maxTotal) * 100));

                  return (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </div>
                        {prod.imagen ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={prod.imagen} 
                            alt={prod.nombre} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate max-w-[320px]">
                            {prod.nombre}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                              {prod.categoria}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {prod.cantidad} {prod.cantidad === 1 ? "unidad vendida" : "unidades vendidas"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end justify-center shrink-0">
                        <p className="text-sm font-black text-slate-900">
                          {formatCOP(prod.total)}
                        </p>
                        <div className="w-32 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="bg-[#00a19a] h-full rounded-full" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-400">
                {loading ? "Analizando pedidos y productos..." : "Aún no hay compras confirmadas registradas."}
              </div>
            )}
          </Card>

          {/* Distribución de Estados de Pedidos */}
          <Card className="p-6 rounded-[24px] border-slate-200/80 shadow-sm bg-white overflow-hidden flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Package className="w-5 h-5 text-purple-600" />
                Estado del Flujo Operativo
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Desglose de pedidos según su fase actual
              </p>

              {data && data.pedidosPorEstado.length > 0 ? (
                <>
                  <div className="h-[200px] w-full my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.pedidosPorEstado}
                          dataKey="count"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                        >
                          {data.pedidosPorEstado.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 mt-4">
                    {data.pedidosPorEstado.map((est, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: est.color }} />
                          <span className="font-semibold text-slate-700">{est.label}</span>
                        </div>
                        <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {est.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400">
                  Sin pedidos para mostrar
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link 
                href="/admin/pedidos" 
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                Ir al Gestor Kanban de Pedidos <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* 4. Tabla de Últimos Pedidos Recientes */}
        <Card className="p-6 rounded-[24px] border-slate-200/80 shadow-sm bg-white overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Historial Reciente de Pedidos
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Monitorea en tiempo real los últimos pedidos ingresados al sistema
              </p>
            </div>
            <Link 
              href="/admin/pedidos" 
              className="text-xs font-bold text-[#00a19a] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              Ver todos los pedidos <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4"># Pedido</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Entrega</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data && data.pedidosRecientes.length > 0 ? (
                  data.pedidosRecientes.map((p) => {
                    const badgeClass = getEstadoBadgeClass(p.estado);
                    const formattedDate = p.fecha ? p.fecha.slice(0, 10) : "N/A";

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          #{p.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{p.clienteNombre}</p>
                          <p className="text-xs text-slate-400">{p.clienteEmail || p.clienteTelefono || "Sin contacto"}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-500">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                            {p.tipoEntrega === "recoleccion" ? "Retiro en Taller" : "Envío a Domicilio"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                            {p.estado.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 text-right">
                          {formatCOP(p.total)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link 
                            href={`/admin/pedidos`}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 hover:bg-[#00a19a] hover:text-white text-slate-600 transition-colors"
                            title="Ver en Gestión de Pedidos"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                      {loading ? "Cargando pedidos recientes..." : "No hay pedidos registrados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  sub, 
  icon, 
  color, 
  badge,
  loading 
}: { 
  title: string; 
  value: string; 
  sub: string; 
  icon: React.ReactNode; 
  color: string; 
  badge?: string;
  loading?: boolean;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <Card className="p-6 rounded-[24px] border-slate-200/80 shadow-sm bg-white h-full hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${colors[color] ?? colors.emerald}`}>
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {badge}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">{title}</h4>
          {loading ? (
            <div className="h-8 w-32 bg-slate-200 animate-pulse rounded-lg my-1" />
          ) : (
            <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          )}
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-500 mt-3 pt-3 border-t border-slate-100">{sub}</p>
    </Card>
  );
}
