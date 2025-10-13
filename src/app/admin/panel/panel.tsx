"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import clsx from "clsx";
import { Button } from "~/components/ui/button";
import { User, Package, ListChecks, CheckCircle2, Clock, BarChart } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  fecha_registro: string;
  rol: string;
  pedidos?: Pedido[];
};

type Pedido = {
  id: string;
  usuario_id: string;
  fecha: string;
  productos: PedidoProducto[];
};

type PedidoProducto = {
  id: string;
  pedido_id: string;
  producto_id: string;
  nombre: string;
  estado: "en_proceso" | "completado" | "enviado" | "entregado";
};

const ESTADOS = [
  { value: "en_proceso", label: "En proceso", color: "bg-yellow-100 text-yellow-800" },
  { value: "completado", label: "Completado", color: "bg-green-100 text-green-800" },
  { value: "enviado", label: "Enviado", color: "bg-blue-100 text-blue-800" },
  { value: "entregado", label: "Entregado", color: "bg-purple-100 text-purple-800" },
];

export default function AdminPanel() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("");
  const [orden, setOrden] = useState<"fecha" | "estado">("fecha");
  const [loading, setLoading] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);

  // Autenticación y obtención de usuario actual desde Supabase
  useEffect(() => {
    const fetchUsuarioActual = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Busca el usuario en la tabla usuarios por su correo
        const usuariosResponse = await supabase
          .from("usuarios")
          .select("*")
          .eq("correo", userData.user.email)
          .single();
        setUsuarioActual((usuariosResponse.data as Usuario) ?? null);
      }
    };
    void fetchUsuarioActual();
  }, []);

  // Trae usuarios y pedidos solo si el usuario es admin
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (usuarioActual?.rol !== "admin") {
        setLoading(false);
        return;
      }
      const { data: usuariosData } = await supabase.from("usuarios").select("*");
      const { data: pedidosData } = await supabase
        .from("pedidos")
        .select("*, productos:pedido_productos(*)");
      setUsuarios(usuariosData ?? []);
      setPedidos(pedidosData ?? []);
      setLoading(false);
    };
    void fetchData();
  }, [usuarioActual]);

  // Relaciona pedidos con usuarios
  const usuariosConPedidos = usuarios.map((u) => ({
    ...u,
    pedidos: pedidos.filter((p) => p.usuario_id === u.id),
  }));

  // Filtros y orden
  let pedidosFiltrados = pedidos;
  if (estadoFiltro) {
    pedidosFiltrados = pedidosFiltrados.filter((p) =>
      p.productos?.some((prod: PedidoProducto) => prod.estado === estadoFiltro)
    );
  }
  pedidosFiltrados = [...pedidosFiltrados].sort((a, b) => {
    if (orden === "fecha") return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    if (orden === "estado") {
      const estadoA = a.productos?.[0]?.estado ?? "";
      const estadoB = b.productos?.[0]?.estado ?? "";
      return estadoA.localeCompare(estadoB);
    }
    return 0;
  });

  // Estadísticas
  const totalUsuarios = usuarios.length;
  const totalPedidos = pedidos.length;
  const productosEnProceso = pedidos.reduce((acc, p) => acc + (p.productos?.filter(prod => prod.estado === "en_proceso").length ?? 0), 0);
  const productosEntregados = pedidos.reduce((acc, p) => acc + (p.productos?.filter(prod => prod.estado === "entregado").length ?? 0), 0);

  // Ejemplo de acción para el nuevo botón
  const handleNuevoBoton = () => {
    alert("Acción del nuevo botón de admin");
  };

  // Verificación de rol y renderizado condicional
  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando datos...</div>;
  }
  if (!usuarioActual || usuarioActual.rol !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-2xl font-bold mb-2">Acceso denegado</div>
        <div className="text-gray-500">No tienes permisos para ver este panel.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-0">
      {/* Navbar superior */}
      <div className="w-full bg-white shadow-sm px-8 py-4 flex justify-between items-center border-b border-gray-200">
        <h1 className="text-3xl font-bold text-[#007973] flex items-center gap-3">
          <BarChart className="w-7 h-7 text-[#00a19a]" /> Panel de Administración
        </h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 shadow font-semibold"
            onClick={handleNuevoBoton}
          >
            Nuevo botón admin
          </Button>
        </div>
      </div>
      {/* Estadísticas */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-8 py-8">
        <div className="rounded-2xl shadow-md bg-white p-4 flex items-center gap-4">
          <User className="w-8 h-8 text-[#007973]" />
          <div>
            <div className="text-xl font-semibold text-gray-700">Usuarios</div>
            <div className="text-2xl font-bold text-[#007973]">{totalUsuarios}</div>
          </div>
        </div>
        <div className="rounded-2xl shadow-md bg-white p-4 flex items-center gap-4">
          <Package className="w-8 h-8 text-blue-600" />
          <div>
            <div className="text-xl font-semibold text-gray-700">Pedidos totales</div>
            <div className="text-2xl font-bold text-blue-600">{totalPedidos}</div>
          </div>
        </div>
        <div className="rounded-2xl shadow-md bg-white p-4 flex items-center gap-4">
          <Clock className="w-8 h-8 text-yellow-500" />
          <div>
            <div className="text-xl font-semibold text-gray-700">En proceso</div>
            <div className="text-2xl font-bold text-yellow-500">{productosEnProceso}</div>
          </div>
        </div>
        <div className="rounded-2xl shadow-md bg-white p-4 flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          <div>
            <div className="text-xl font-semibold text-gray-700">Entregados</div>
            <div className="text-2xl font-bold text-green-600">{productosEntregados}</div>
          </div>
        </div>
      </div>
      {/* Tabla de usuarios */}
      <div className="mb-12 px-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <User className="w-5 h-5 text-[#007973]" /> Usuarios
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Nombre</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Correo</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Pedidos</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Fecha registro</th>
              </tr>
            </thead>
            <tbody>
              {usuariosConPedidos.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00a19a]" />
                    <span className="font-semibold text-gray-800">{u.nombre}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{u.correo}</td>
                  <td className="px-4 py-2 text-blue-700 font-bold">{u.pedidos?.length ?? 0}</td>
                  <td className="px-4 py-2 text-gray-500">{u.fecha_registro?.slice(0, 19).replace("T", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Filtros y pedidos */}
      <div className="mb-8 px-8">
        <div className="mb-4 text-lg font-semibold text-gray-700">Filtrar pedidos</div>
        <div className="flex flex-wrap gap-4 items-center">
          <label htmlFor="estadoFiltro" className="sr-only">Filtrar por estado</label>
          <select
            id="estadoFiltro"
            aria-label="Filtrar por estado"
            className="border rounded-md shadow-sm bg-white ring-1 ring-gray-200 px-3 py-2 text-base"
            value={estadoFiltro}
            onChange={e => setEstadoFiltro(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <label htmlFor="ordenSelect" className="sr-only">Ordenar pedidos</label>
          <select
            id="ordenSelect"
            aria-label="Ordenar pedidos"
            className="border rounded-md shadow-sm bg-white ring-1 ring-gray-200 px-3 py-2 text-base"
            value={orden}
            onChange={e => setOrden(e.target.value as "fecha" | "estado")}
          >
            <option value="fecha">Ordenar por fecha</option>
            <option value="estado">Ordenar por estado</option>
          </select>
        </div>
      </div>
      {/* Tarjetas de pedidos */}
      <div className="overflow-x-auto px-8 flex flex-col gap-6">
        {pedidosFiltrados.map((p) => (
          <div
            key={p.id}
            className="bg-slate-50 border border-slate-200 rounded-xl shadow-md p-6 flex flex-col gap-2 min-w-[320px] max-w-2xl mx-auto"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-blue-600" /> Pedido #{p.id}
              </div>
              <div className="text-sm text-gray-500">
                {p.fecha?.slice(0, 19).replace("T", " ")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="font-medium text-gray-700">
                Usuario: {usuarios.find(u => u.id === p.usuario_id)?.nombre ?? "-"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {p.productos?.map((prod: PedidoProducto) => (
                <span
                  key={prod.id}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                >
                  {prod.nombre}
                  <span
                    className={clsx(
                      "ml-2 px-2 py-0.5 rounded-full text-xs font-bold",
                      prod.estado === "en_proceso" && "bg-yellow-100 text-yellow-800",
                      prod.estado === "completado" && "bg-green-100 text-green-800",
                      prod.estado === "enviado" && "bg-blue-100 text-blue-800",
                      prod.estado === "entregado" && "bg-purple-100 text-purple-800"
                    )}
                  >
                    {ESTADOS.find(e => e.value === prod.estado)?.label ?? prod.estado}
                  </span>
                </span>
              ))}
            </div>
            {/* Barra de progreso visual */}
            {p.productos && p.productos.length > 1 && (
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={clsx(
                    "h-2 rounded-full transition-all bg-emerald-500",
                    `progress-bar-width-${Math.round((p.productos.filter(prod => prod.estado === "entregado").length / p.productos.length) * 100)}`
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <style jsx global>{`
        @media (max-width: 640px) {
          .min-w-[320px] { min-width: 100% !important; }
          .max-w-2xl { max-width: 100% !important; }
        }
        ${Array.from({ length: 101 }, (_, i) => `.progress-bar-width-${i} { width: ${i}%; }`).join('\n')}
      `}</style>
    </div>
  );
}
  