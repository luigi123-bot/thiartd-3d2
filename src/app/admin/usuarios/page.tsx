"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CreateUserModal } from "~/components/CreateUserModal";
import { 
  Users, 
  UserPlus, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  Calendar,
  ArrowUpRight,
  MoreVertical,
  Mail,
  Shield,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Usuario {
  id?: string;
  nombre?: string;
  email?: string;
  clerk_id?: string;
  creado_en?: string;
  role?: string;
  rol?: string;
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
          Métrica
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

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteUsuario = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/usuarios?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsuarios(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Error al eliminar el usuario");
      }
    } catch {
      alert("Error de red al eliminar el usuario");
    } finally {
      setDeletingId(null);
    }
  };

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios");
      const data = (await res.json()) as { usuarios?: Usuario[] };
      setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
    } catch {
      setUsuarios([]);
    }
    setLoading(false);
  }, []);

  const syncClerkUsuarios = async () => {
    setSyncing(true);
    try {
      await fetch("/api/usuarios/clerk-usuarios");
      await fetchUsuarios();
    } catch (error) {
      console.error("Error syncing users:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    void fetchUsuarios();
  }, [fetchUsuarios]);

  const filteredUsuarios = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ??
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas
  const totalUsuarios = usuarios.length;
  const adminCount = usuarios.filter(u => (u.role ?? u.rol)?.toLowerCase() === 'admin').length;
  const clerkUsers = usuarios.filter(u => !!u.clerk_id).length;
  const recentUsers = usuarios.filter(u => {
    if (!u.creado_en) return false;
    const date = new Date(u.creado_en);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff < (7 * 24 * 60 * 60 * 1000); // 7 días
  }).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans">
      <div className="max-w-[1920px] mx-auto space-y-10">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Usuarios del Sistema</h1>
            </div>
            <p className="text-slate-500 font-medium">Gestión de accesos y perfiles de usuario</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#00a19a] outline-none shadow-sm transition-all text-sm font-bold"
              />
            </div>
            <Button 
              onClick={() => setModalOpen(true)}
              className="h-14 px-8 bg-[#00a19a] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#008f89] shadow-xl shadow-[#00a19a]/20"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              Nuevo Usuario
            </Button>
            <Button 
              onClick={syncClerkUsuarios}
              disabled={syncing}
              variant="outline"
              className="h-14 px-8 border-2 border-slate-100 hover:border-slate-900 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl bg-white"
            >
              <RefreshCw className={`w-5 h-5 mr-3 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Usuarios"
            value={totalUsuarios}
            icon={Users as React.ComponentType<IconProps>}
            color="brand"
            detail="Registrados en plataforma"
          />
          <StatCard
            title="Administradores"
            value={adminCount}
            icon={ShieldCheck as React.ComponentType<IconProps>}
            color="emerald"
            detail="Acceso total"
          />
          <StatCard
            title="Sincronizados"
            value={clerkUsers}
            icon={UserCheck as React.ComponentType<IconProps>}
            color="slate"
            detail="A través de Clerk"
          />
          <StatCard
            title="Nuevos (7d)"
            value={recentUsers}
            icon={UserPlus as React.ComponentType<IconProps>}
            color="amber"
            detail="Última semana"
          />
        </div>

        {/* Main Content Card */}
        <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white ring-1 ring-slate-100">
          {/* Table Toolbar */}
          <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Listado Completo</span>
              </div>
            </div>
            <div className="text-sm text-slate-400 font-bold">
              Mostrando <span className="text-slate-900">{filteredUsuarios.length}</span> usuarios
            </div>
          </div>

          {/* Custom Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identidad</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Contacto</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Rol / Permisos</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Registro</th>
                  <th className="px-10 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-10 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-[#00a19a]/20 border-t-[#00a19a] rounded-full animate-spin" />
                          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando base de datos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsuarios.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-medium">
                        No se encontraron usuarios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredUsuarios.map((u, idx) => {
                      const rol = (u.role ?? u.rol ?? "cliente").toLowerCase();
                      const isRecent = u.creado_en && (new Date().getTime() - new Date(u.creado_en).getTime() < 24 * 60 * 60 * 1000);

                      const getRoleBadge = (r: string) => {
                        const configMap: Record<string, { color: string; icon: React.ComponentType<IconProps> }> = {
                          admin: { color: "text-emerald-700 bg-emerald-50 border-emerald-100", icon: ShieldCheck as React.ComponentType<IconProps> },
                          creador: { color: "text-[#00a19a] bg-[#00a19a]/5 border-[#00a19a]/10", icon: UserPlus as React.ComponentType<IconProps> },
                          cliente: { color: "text-slate-600 bg-slate-50 border-slate-100", icon: UserCheck as React.ComponentType<IconProps> },
                        };
                        const isUUID = r.length > 20 || /^[0-9a-fA-F-]{30,}$/.test(r);
                        const displayRole = isUUID ? "cliente" : r;
                        
                        const config = configMap[displayRole] ?? configMap.cliente!;
                        
                        const Icon = config.icon;
                        return (
                          <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${config.color}`}>
                            <Icon className="w-3.5 h-3.5 mr-2" />
                            {displayRole}
                          </span>
                        );
                      };

                      return (
                        <motion.tr
                          key={u.id ?? u.email ?? idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-slate-50/80 transition-all group"
                        >
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform relative">
                                {(u.nombre ?? u.email ?? 'U').charAt(0).toUpperCase()}
                                {isRecent && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                                )}
                              </div>
                              <div>
                                <div className="text-base font-black text-slate-900 tracking-tight leading-none mb-1.5 flex items-center gap-2">
                                  {u.nombre ?? "Usuario Invitado"}
                                </div>
                                <div className="text-xs text-slate-400 font-medium lowercase">
                                  @{u.nombre?.toLowerCase().replace(/\s+/g, '') ?? "sin_nombre"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {u.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            {getRoleBadge(rol)}
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {u.creado_en ? new Date(u.creado_en).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) : '-'}
                            </div>
                          </td>
                          <td className="px-10 py-8 text-center">
                            <div className="flex justify-center gap-2 lg:opacity-40 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                className="h-10 w-10 p-0 border-2 border-slate-100 hover:border-slate-900 rounded-xl transition-all"
                                title="Ver detalles"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => u.id && void deleteUsuario(u.id)}
                                disabled={deletingId === u.id}
                                className="h-10 w-10 p-0 border-2 border-red-50 hover:border-red-500 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                                title="Eliminar usuario"
                              >
                                {deletingId === u.id
                                  ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                                  : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <CreateUserModal
        open={modalOpen}
        onOpenChangeAction={setModalOpen}
        onUserCreated={fetchUsuarios}
      />
    </div>
  );
}
