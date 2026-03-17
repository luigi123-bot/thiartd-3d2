"use client";

import { useState, useEffect } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "~/components/ui/use-toast";
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
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Pedido {
  id: number;
  cliente_id: string;
  estado: string;
  total: number;
  datos_contacto: string;
  numero_tracking?: string;
  empresa_envio?: string;
  fecha_estimada_entrega?: string;
  created_at: string;
  ciudad_envio?: string;
  direccion_envio?: string;
}

interface HistorialEnvio {
  id: number;
  estado: string;
  descripcion?: string;
  ubicacion?: string;
  fecha: string;
}

interface TrackingApiResponse {
  historial: HistorialEnvio[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconType = React.ComponentType<any>;

interface EstadoInfo {
  value: string;
  label: string;
  icon: IconType;
  color: string;
  bgColor: string;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const estadosEnvio: EstadoInfo[] = [
  { value: "pagado", label: "Pagado", icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  { value: "en_preparacion", label: "En preparación", icon: Package, color: "text-blue-600", bgColor: "bg-blue-50" },
  { value: "en_envio", label: "En envío", icon: Truck, color: "text-purple-600", bgColor: "bg-purple-50" },
  { value: "en_transito", label: "En tránsito", icon: MapPin, color: "text-orange-600", bgColor: "bg-orange-50" },
  { value: "entregado", label: "Entregado", icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  { value: "problema_entrega", label: "Problema entrega", icon: Clock, color: "text-red-600", bgColor: "bg-red-50" },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

interface FormTracking {
  estado: string;
  descripcion: string;
  ubicacion: string;
  numero_tracking: string;
  empresa_envio: string;
  fecha_estimada_entrega: string;
}

type StatColor = "brand" | "amber" | "emerald" | "slate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatCard({ title, value, icon: Icon, color, detail }: { title: string, value: string | number, icon: React.ComponentType<any>, color: StatColor, detail: string }) {
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
          Envío
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

export default function EnviosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [historial, setHistorial] = useState<HistorialEnvio[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actualizandoTracking, setActualizandoTracking] = useState(false);
  const { toast } = useToast();

  const [formTracking, setFormTracking] = useState<FormTracking>({
    estado: "",
    descripcion: "",
    ubicacion: "",
    numero_tracking: "",
    empresa_envio: "",
    fecha_estimada_entrega: ""
  });

  const fetchPedidos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .neq("estado", "pendiente_pago")
      .order("created_at", { ascending: false });
    
    setPedidos((data ?? []) as Pedido[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchPedidos();
  }, []);

  useEffect(() => {
    if (pedidoSeleccionado) {
      const fetchHistorial = async () => {
        const response = await fetch(`/api/tracking?pedido_id=${pedidoSeleccionado.id}`);
        const data = await response.json() as TrackingApiResponse;
        setHistorial(data.historial ?? []);
      };

      void fetchHistorial();

      const fechaEntrega = pedidoSeleccionado.fecha_estimada_entrega 
        ? new Date(pedidoSeleccionado.fecha_estimada_entrega).toISOString().split('T')[0]
        : "";
        
      setFormTracking({
        estado: pedidoSeleccionado.estado,
        descripcion: "",
        ubicacion: "",
        numero_tracking: pedidoSeleccionado.numero_tracking ?? "",
        empresa_envio: pedidoSeleccionado.empresa_envio ?? "",
        fecha_estimada_entrega: fechaEntrega ?? ""
      });
    }
  }, [pedidoSeleccionado]);

  const actualizarTracking = async () => {
    if (!pedidoSeleccionado) return;
    setActualizandoTracking(true);

    try {
      const response = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: pedidoSeleccionado.id,
          ...formTracking
        })
      });

      if (response.ok) {
        toast({
          title: "Tracking actualizado",
          description: "El estado del envío ha sido actualizado correctamente"
        });

        const { data } = await supabase
          .from("pedidos")
          .select("*")
          .eq("id", pedidoSeleccionado.id)
          .single<Pedido>();

        if (data) {
          setPedidoSeleccionado(data);
          setPedidos(prev => prev.map(p => p.id === data.id ? data : p));
        }

        const historialResponse = await fetch(`/api/tracking?pedido_id=${pedidoSeleccionado.id}`);
        const historialData = await historialResponse.json() as TrackingApiResponse;
        setHistorial(historialData.historial ?? []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActualizandoTracking(false);
    }
  };

  const getEstadoInfo = (estado: string): EstadoInfo => {
    return estadosEnvio.find(e => e.value === estado) ?? estadosEnvio[0]!;
  };

  const filteredPedidos = pedidos.filter(p => {
    const contacto = JSON.parse(p.datos_contacto ?? "{}") as { nombre?: string, email?: string };
    const matchId = p.id.toString().includes(searchTerm);
    const matchNombre = contacto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchCiudad = p.ciudad_envio?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    return matchId || matchNombre || matchCiudad;
  });

  // Stats
  const enTransito = pedidos.filter(p => p.estado === 'en_transito' || p.estado === 'en_envio').length;
  const entregados = pedidos.filter(p => p.estado === 'entregado').length;
  const problemas = pedidos.filter(p => p.estado === 'problema_entrega').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
      <div className="max-w-[1920px] mx-auto space-y-10">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl">
                <Truck className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Gestión de Envíos</h1>
            </div>
            <p className="text-slate-500 font-medium">Logística y seguimiento en tiempo real</p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar pedido, cliente o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#00a19a] outline-none shadow-sm transition-all text-sm font-bold"
              />
            </div>
            <Button className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl">
              <Download className="w-5 h-5 mr-3" />
              Reporte
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* eslint-disable @typescript-eslint/no-unsafe-assignment */}
          <StatCard
            title="Total Activos"
            value={pedidos.length}
            icon={Package}
            color="brand"
            detail="Envíos gestionados"
          />
          <StatCard
            title="En Tránsito"
            value={enTransito}
            icon={Truck}
            color="emerald"
            detail="Hacia destino"
          />
          <StatCard
            title="Entregados"
            value={entregados}
            icon={CheckCircle}
            color="slate"
            detail="Exitosos"
          />
          <StatCard
            title="Novedades"
            value={problemas}
            icon={Clock}
            color="amber"
            detail="Requieren atención"
          />
          {/* eslint-enable @typescript-eslint/no-unsafe-assignment */}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main List */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white ring-1 ring-slate-100">
               <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Envíos Pendientes de Seguimiento</span>
                </div>
                <div className="text-sm text-slate-400 font-bold">
                  {filteredPedidos.length} Pedidos
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Referencia & Cliente</th>
                      <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Destino</th>
                      <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado Actual</th>
                      <th className="px-10 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {loading ? (
                         <tr><td colSpan={4} className="py-20 text-center text-slate-400">Cargando envíos...</td></tr>
                      ) : filteredPedidos.map((p, _idx) => {
                        const contacto = JSON.parse(p.datos_contacto ?? "{}") as { nombre?: string };
                        const estadoInfo = getEstadoInfo(p.estado);
                        const isSelected = pedidoSeleccionado?.id === p.id;

                        return (
                          <motion.tr
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: _idx * 0.03 }}
                            className={`hover:bg-slate-50/80 transition-all cursor-pointer group ${isSelected ? 'bg-slate-50' : ''}`}
                            onClick={() => setPedidoSeleccionado(p)}
                          >
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 ${isSelected ? 'bg-[#00a19a]' : 'bg-slate-900'} rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                                  #{p.id}
                                </div>
                                <div>
                                  <div className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5">
                                    {contacto.nombre ?? "Sin Nombre"}
                                  </div>
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                    Tracking: {p.numero_tracking ?? "Sin asignar"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <div className="text-sm font-black text-slate-900 leading-tight mb-1">
                                {p.ciudad_envio ?? "No definido"}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">
                                {p.direccion_envio}
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${estadoInfo.bgColor} ${estadoInfo.color} border-current/10`}>
                                <estadoInfo.icon className="w-3.5 h-3.5 mr-2" />
                                {estadoInfo.label}
                              </span>
                            </td>
                            <td className="px-10 py-8 text-center">
                              <Button
                                variant="outline"
                                className={`h-10 w-10 p-0 rounded-xl transition-all ${isSelected ? 'bg-[#00a19a] text-white border-[#00a19a]' : 'border-slate-100 hover:border-slate-900'}`}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
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

          {/* Side Panel: Detail & Update */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {pedidoSeleccionado ? (
                <motion.div
                  key={pedidoSeleccionado.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Update Form */}
                  <Card className="border-none shadow-2xl rounded-[40px] p-8 bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Truck size={120} />
                    </div>
                    
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                      <Send className="text-[#00a19a]" />
                      Actualizar Envío #{pedidoSeleccionado.id}
                    </h3>

                    <div className="space-y-6 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado Logístico</label>
                        <select
                          className="w-full h-12 px-4 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00a19a] font-bold"
                          value={formTracking.estado}
                          onChange={(e) => setFormTracking({...formTracking, estado: e.target.value})}
                          aria-label="Estado del envío"
                        >
                          {estadosEnvio.map((estado) => (
                            <option key={estado.value} value={estado.value} className="text-slate-900 font-bold">
                              {estado.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">N° Tracking</label>
                          <Input
                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl font-bold"
                            value={formTracking.numero_tracking}
                            onChange={(e) => setFormTracking({...formTracking, numero_tracking: e.target.value})}
                            placeholder="Ej: TK-12345"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empresa</label>
                          <Input
                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl font-bold"
                            value={formTracking.empresa_envio}
                            onChange={(e) => setFormTracking({...formTracking, empresa_envio: e.target.value})}
                            placeholder="Ej: Servientrega"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ubicación Actual</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            className="h-12 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl font-bold"
                            value={formTracking.ubicacion}
                            onChange={(e) => setFormTracking({...formTracking, ubicacion: e.target.value})}
                            placeholder="Ciudad o Centro"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entrega Estimada</label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type="date"
                            className="h-12 pl-12 bg-white/10 border-white/20 text-white rounded-xl font-bold [color-scheme:dark]"
                            value={formTracking.fecha_estimada_entrega}
                            onChange={(e) => setFormTracking({...formTracking, fecha_estimada_entrega: e.target.value})}
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={actualizarTracking}
                        disabled={actualizandoTracking}
                        className="w-full h-14 bg-[#00a19a] hover:bg-[#00897B] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#00a19a]/20 group transition-all"
                      >
                        {actualizandoTracking ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <div className="flex items-center gap-2">
                            Actualizar Tracking
                            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </div>
                        )}
                      </Button>
                    </div>
                  </Card>

                  {/* History Timeline */}
                  <Card className="border-none shadow-2xl rounded-[40px] p-8 bg-white ring-1 ring-slate-100">
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 text-slate-900">
                      <History className="text-slate-400" />
                      Historial de Eventos
                    </h3>

                    <div className="space-y-6">
                      {historial.length === 0 ? (
                        <div className="text-center py-10">
                          <Package className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                          <p className="text-slate-400 font-bold text-sm">Sin eventos registrados aún</p>
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                          {historial.map((item) => {
                            const info = getEstadoInfo(item.estado);
                            return (
                              <div key={item.id} className="relative">
                                <div className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-md ${info.color.replace('text', 'bg')}`} />
                                <div className="space-y-1">
                                  <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${info.color}`}>{info.label}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{new Date(item.fecha).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-sm font-black text-slate-900">{item.ubicacion ?? 'Ubicación no especificada'}</p>
                                  {item.descripcion && <p className="text-xs text-slate-500 font-medium">{item.descripcion}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>

                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-40">
                  <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-300">
                    <Package size={48} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Selecciona un envío</h4>
                    <p className="text-sm font-bold text-slate-400">Para ver el detalle completo y actualizar su estado logístico</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
