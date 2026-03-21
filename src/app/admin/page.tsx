"use client";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "~/components/ui/dialog";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { motion } from "framer-motion";
import { 
  TrendingUp, Users, Package, 
  MessageSquare, Bell, Download, FileText, 
  Activity, DollarSign, Wallet, ArrowUpRight, Mail, Settings2
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS = ["#00a19a", "#007973", "#fbbf24", "#ef4444", "#6366f1", "#10b981"];

interface Resumen {
  ingresos: number;
  egresos: number;
  utilidad: number;
  pedidos: number;
  productos: number;
  usuarios: number;
  mensajes: number;
  notificaciones: number;
}

interface VentaPorMes {
  mes: string;
  total: number;
}
interface ProductoPorCategoria {
  categoria: string;
  value: number;
}
interface UsuarioPorMes {
  mes: string;
  value: number;
}

export default function AdminDashboardPage() {
  const [resumen, setResumen] = useState<Resumen>({
    ingresos: 0,
    egresos: 0,
    utilidad: 0,
    pedidos: 0,
    productos: 0,
    usuarios: 0,
    mensajes: 0,
    notificaciones: 0,
  });
  const [ventasPorMes, setVentasPorMes] = useState<VentaPorMes[]>([]);
  const [productosPorCategoria, setProductosPorCategoria] = useState<ProductoPorCategoria[]>([]);
  const [usuariosPorMes, setUsuariosPorMes] = useState<UsuarioPorMes[]>([]);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [managerEmail, setManagerEmail] = useState("");
  const [openConfig, setOpenConfig] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: pedidos } = await supabase
        .from("pedidos")
        .select("total, estado, created_at") as { data: { total: number; estado: string; created_at: string }[] | null };
      
      const { data: egresos } = await supabase
        .from("egresos")
        .select("monto, created_at") as { data: { monto: number; created_at: string }[] | null };
      
      const { data: productos } = await supabase
        .from("productos")
        .select("id, categoria") as { data: { id: number; categoria: string }[] | null };
      
      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("id, creado_en") as { data: { id: number; creado_en: string }[] | null };
      
      const { data: mensajes } = await supabase
        .from("mensajes")
        .select("id") as { data: { id: number }[] | null };
      
      const { data: notificaciones } = await supabase
        .from("notificaciones")
        .select("id") as { data: { id: number }[] | null };

      const ingresos = (pedidos ?? []).filter(p => p.estado === 'pagado').reduce((acc, p) => acc + (Number(p.total) ?? 0), 0);
      const egresosTotal = (egresos ?? []).reduce((acc, e) => acc + (Number(e.monto) ?? 0), 0);
      
      setResumen({
        ingresos,
        egresos: egresosTotal,
        utilidad: ingresos - egresosTotal,
        pedidos: pedidos?.length ?? 0,
        productos: productos?.length ?? 0,
        usuarios: usuarios?.length ?? 0,
        mensajes: mensajes?.length ?? 0,
        notificaciones: notificaciones?.length ?? 0,
      });

      const ventasMes: Record<string, number> = {};
      (pedidos ?? []).filter(p => p.estado === 'pagado').forEach((p) => {
        const mes = typeof p.created_at === "string" ? p.created_at.slice(0, 7) : "Sin fecha";
        ventasMes[mes] = (ventasMes[mes] ?? 0) + (Number(p.total) ?? 0);
      });
      setVentasPorMes(Object.entries(ventasMes).map(([mes, total]) => ({ mes, total })));

      const cat: Record<string, number> = {};
      (productos ?? []).forEach((p) => {
        cat[p.categoria ?? "Otros"] = (cat[p.categoria ?? "Otros"] ?? 0) + 1;
      });
      setProductosPorCategoria(Object.entries(cat).map(([categoria, value]) => ({ categoria, value })));

      const usuariosMes: Record<string, number> = {};
      (usuarios ?? []).forEach((u) => {
        const mes = typeof u.creado_en === "string" ? u.creado_en.slice(0, 7) : "Sin fecha";
        usuariosMes[mes] = (usuariosMes[mes] ?? 0) + 1;
      });
      setUsuariosPorMes(Object.entries(usuariosMes).map(([mes, value]) => ({ mes, value })));
    }
    void fetchData();

    // Cargar config actual
    fetch("/api/admin/configuraciones")
      .then(r => r.json())
      .then((d: unknown) => {
        const data = d as { valor?: string };
        setManagerEmail(data.valor ?? "");
      })
      .catch(console.error);
  }, []);

  const handleUpdateEmail = async () => {
    try {
      const resp = await fetch("/api/admin/configuraciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: managerEmail })
      });
      if (resp.ok) {
        alert("✅ Correo del gerente configurado correctamente.");
        setOpenConfig(false);
      } else {
        alert("❌ Error al guardar la configuración.");
      }
    } catch (e) {
      console.error(e);
      alert("❌ Error de comunicación.");
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
        alert(`📊 Reporte enviado exitosamente a: ${managerEmail}`);
      } else {
        const d = (await resp.json()) as { error?: string };
        alert(d.error ?? "Error al procesar el reporte.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión.");
    } finally {
      setGenerandoReporte(false);
    }
  };

  const exportarCSV = () => {
    const rows = [
      ["Métrica", "Valor"],
      ...(Object.entries(resumen) as [string, number][]).map(([k, v]) => [k, String(v)]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-thiart3d-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Elegante */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
              Business <span className="text-[#00a19a]">Intelligence</span>
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00a19a]" />
              Monitorización de rendimiento y salud de la plataforma
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline"
              onClick={exportarCSV} 
              className="h-12 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            
            <div className="flex items-center">
              <Button 
                onClick={handleGenerarReporte}
                disabled={generandoReporte}
                className="h-12 px-6 rounded-l-xl bg-slate-900 text-white font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 border-r border-slate-700"
              >
                {generandoReporte ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {generandoReporte ? "Generando..." : "Enviar Reporte"}
              </Button>
              
              <Dialog open={openConfig} onOpenChange={setOpenConfig}>
                <DialogTrigger asChild>
                  <Button className="h-12 px-3 rounded-r-xl bg-slate-900 text-white hover:bg-slate-800 transition-all border-l border-slate-700">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[#00a19a]" />
                      Configurar Destinatario
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-slate-500">
                      Introduce el correo electrónico del gerente para recibir los informes ejecutivos.
                    </p>
                    <Input 
                      placeholder="correo@gerente.com" 
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      className="h-11 rounded-lg"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUpdateEmail} className="bg-[#00a19a] hover:bg-[#007973] font-bold">
                      Guardar Cambios
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Ingresos Netos" 
            value={`$${resumen.ingresos.toLocaleString("es-CO")}`} 
            sub="Ventas confirmadas"
            icon={<DollarSign className="w-6 h-6" />}
            color="emerald"
          />
          <StatCard 
            title="Utilidad Total" 
            value={`$${resumen.utilidad.toLocaleString("es-CO")}`} 
            sub="Balance ingresos/egresos"
            icon={<Wallet className="w-6 h-6" />}
            color="blue"
          />
          <StatCard 
            title="Total Pedidos" 
            value={resumen.pedidos} 
            sub="Histórico completo"
            icon={<Package className="w-6 h-6" />}
            color="amber"
          />
          <StatCard 
            title="Usuarios" 
            value={resumen.usuarios} 
            sub="Clientes registrados"
            icon={<Users className="w-6 h-6" />}
            color="indigo"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 rounded-[24px] border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00a19a]" />
              Ventas por Mes
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasPorMes}>
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total" fill="#00a19a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 rounded-[24px] border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Crecimiento de Usuarios
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usuariosPorMes}>
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }}  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 rounded-[24px] border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Productos por Categoría
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={productosPorCategoria} 
                    dataKey="value" 
                    nameKey="categoria" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    paddingAngle={5}
                  >
                    {productosPorCategoria.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-6 rounded-[24px] border-slate-200/60 shadow-sm bg-white flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4">
                <Bell className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black text-slate-900">{resumen.notificaciones}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Alertas Sistema</div>
            </Card>
            
            <Card className="p-6 rounded-[24px] border-slate-200/60 shadow-sm bg-white flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black text-slate-900">{resumen.mensajes}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Mensajes Chat</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }: { title: string, value: string | number, sub: string, icon: React.ReactNode, color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6 rounded-[24px] border-slate-200/60 shadow-sm bg-white h-full hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${colors[color]}`}>
            {icon}
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-300" />
        </div>
        <div className="space-y-1">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h4>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
          <p className="text-xs font-medium text-slate-500">{sub}</p>
        </div>
      </Card>
    </motion.div>
  );
}
