"use client";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
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
  interface VentaPorMes {
    mes: string;
    total: number;
  }
  const [ventasPorMes, setVentasPorMes] = useState<VentaPorMes[]>([]);
  interface ProductoPorCategoria {
    categoria: string;
    value: number;
  }
  const [productosPorCategoria, setProductosPorCategoria] = useState<ProductoPorCategoria[]>([]);
  interface UsuarioPorMes {
    mes: string;
    value: number;
  }
  const [usuariosPorMes, setUsuariosPorMes] = useState<UsuarioPorMes[]>([]);
  // const [loading, setLoading] = useState(true);

  // Cargar métricas
  useEffect(() => {
    async function fetchData() {
      // setLoading(true);

      // Total ingresos y egresos (ejemplo: suma de pedidos y egresos)
      const { data: pedidos } = await supabase
        .from("pedidos")
        .select("total, estado, created_at") as { data: { total: number; estado: string; created_at: string }[] | null };
      const { data: egresos } = await supabase.from("egresos").select("monto, created_at");
      const { data: productos } = await supabase
        .from("productos")
        .select("id, categoria") as { data: { id: number; categoria: string }[] | null };
      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("id, creado_en") as { data: { id: number; creado_en: string }[] | null };
      const { data: mensajes } = await supabase.from("mensajes").select("id");
      const { data: notificaciones } = await supabase.from("notificaciones").select("id");

      // Resumen
      const ingresos = (pedidos ?? []).reduce((acc, p) => acc + (Number(p.total) ?? 0), 0);
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

      // Ventas por mes
      const ventasMes: Record<string, number> = {};
      (pedidos ?? []).forEach((p) => {
        const mes = typeof p.created_at === "string" ? p.created_at.slice(0, 7) : "Sin fecha";
        ventasMes[mes] = (ventasMes[mes] ?? 0) + (Number(p.total) ?? 0);
      });
      setVentasPorMes(Object.entries(ventasMes).map(([mes, total]) => ({ mes, total })));

      // Productos por categoría
      const cat: Record<string, number> = {};
      (productos ?? []).forEach((p) => {
        cat[p.categoria] = (cat[p.categoria] ?? 0) + 1;
      });
      setProductosPorCategoria(Object.entries(cat).map(([categoria, value]) => ({ categoria, value })));

      // Usuarios por mes
      const usuariosMes: Record<string, number> = {};
      (usuarios ?? []).forEach((u) => {
        const mes = u.creado_en?.slice(0, 7) ?? "Sin fecha";
        usuariosMes[mes] = (usuariosMes[mes] ?? 0) + 1;
      });
      setUsuariosPorMes(Object.entries(usuariosMes).map(([mes, value]) => ({ mes, value })));

      // setLoading(false);
    }
    void fetchData();
  }, []);

  // Exportar informe CSV
  const exportarCSV = () => {
    const rows = [
      ["Métrica", "Valor"],
      ...Object.entries(resumen),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "informe-thiart3d.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Dashboard de Plataforma</h1>
          <p className="text-sm sm:text-base text-gray-500">Resumen y métricas globales</p>
        </div>
        <Button onClick={exportarCSV} className="text-sm sm:text-base w-full sm:w-auto">
          <span className="hidden xs:inline">Exportar informe CSV</span>
          <span className="xs:hidden">Exportar CSV</span>
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="p-3 sm:p-4 flex flex-col items-center overflow-hidden">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#00a19a] text-center">
            {resumen.ingresos?.toLocaleString("es-CL", { style: "currency", currency: "CLP" }) || "-"}
          </div>
          <div className="text-gray-500 text-xs sm:text-sm text-center">Ingresos</div>
        </Card>
        <Card className="p-3 sm:p-4 flex flex-col items-center overflow-hidden">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#ef4444] text-center">
            {resumen.egresos?.toLocaleString("es-CL", { style: "currency", currency: "CLP" }) || "-"}
          </div>
          <div className="text-gray-500 text-xs sm:text-sm text-center">Egresos</div>
        </Card>
        <Card className="p-3 sm:p-4 flex flex-col items-center overflow-hidden">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#10b981] text-center">
            {resumen.utilidad?.toLocaleString("es-CL", { style: "currency", currency: "CLP" }) || "-"}
          </div>
          <div className="text-gray-500 text-xs sm:text-sm text-center">Utilidad</div>
        </Card>
        <Card className="p-3 sm:p-4 flex flex-col items-center overflow-hidden">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center">{resumen.usuarios || "-"}</div>
          <div className="text-gray-500 text-xs sm:text-sm text-center">Usuarios</div>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
        <Card className="p-3 sm:p-4 overflow-hidden">
          <div className="font-semibold mb-2 text-sm sm:text-base">Ventas por mes</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ventasPorMes}>
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#00a19a" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-3 sm:p-4 overflow-hidden">
          <div className="font-semibold mb-2 text-sm sm:text-base">Productos por categoría</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={productosPorCategoria} dataKey="value" nameKey="categoria" cx="50%" cy="50%" outerRadius={60} label={(entry) => entry.value}>
                {productosPorCategoria.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-3 sm:p-4 overflow-hidden">
          <div className="font-semibold mb-2 text-sm sm:text-base">Usuarios registrados por mes</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={usuariosPorMes}>
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#007973" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-3 sm:p-4 overflow-hidden">
          <div className="font-semibold mb-2 text-sm sm:text-base">Pedidos totales</div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#00a19a]">{resumen.pedidos || "-"}</div>
        </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        <Card className="p-3 sm:p-4 overflow-hidden">
          <div className="font-semibold mb-2 text-sm sm:text-base">Mensajes totales</div>
          <div className="text-2xl sm:text-3xl font-bold">{resumen.mensajes || "-"}</div>
        </Card>
        <Card className="p-3 sm:p-4 overflow-hidden">
          <div className="font-semibold mb-2 text-sm sm:text-base">Notificaciones totales</div>
          <div className="text-2xl sm:text-3xl font-bold">{resumen.notificaciones || "-"}</div>
        </Card>
      </div>
    </div>
  );
}
