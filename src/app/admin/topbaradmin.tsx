"use client";
import Link from "next/link";
import {
  FiBox,
  FiUsers,
  FiTruck,
  FiShoppingCart,
  FiMessageCircle,
  FiHome,
  FiBell,
  FiMenu,
  FiX,
  FiLogOut,
  FiShoppingBag
} from "react-icons/fi";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SupabaseAuth from "~/components/SupabaseAuth";
import { UserCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import clsx from "clsx";

const MENU = [
  { href: "/admin", label: "Inicio", icon: FiHome },
  { href: "/admin/inventario", label: "Inventario", icon: FiBox },
  { href: "/admin/usuarios", label: "Usuarios", icon: FiUsers },
  { href: "/admin/envios", label: "Envíos", icon: FiTruck },
  { href: "/admin/pedidos", label: "Pedidos", icon: FiShoppingCart },
  { href: "/admin/mensajes", label: "Mensajes", icon: FiMessageCircle },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Notification {
  id: string | number;
  tipo: string;
  texto: string;
  fecha: string;
  visto?: boolean;
  pedido_id?: number;
}

interface NotifDb {
  id: string | number;
  titulo?: string;
  mensaje?: string;
  created_at: string;
  enviado?: boolean;
}

interface PedidoDb {
  id: number;
  created_at: string;
}

interface MensajeDb {
  id: string | number;
  asunto?: string;
  created_at: string;
}

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isSidebarExpanded = !isCollapsed || isHovered;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [unread, setUnread] = useState(0);
  const [usuario, setUsuario] = useState<{
    id?: string;
    nombre?: string;
    email?: string;
    avatar_url?: string;
  } | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Cargar estado de colapso desde localStorage al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_sidebar_collapsed");
      if (stored !== null) {
        setIsCollapsed(stored === "true");
      }
    }
  }, []);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("admin_sidebar_collapsed", String(next));
  };
  void handleToggleCollapse; // reservado para el botón de colapso manual si se reactiva

  const fetchNotifications = useCallback(async () => {
    setLoadingNotif(true);
    try {
      const [notifsSys, pedidosPending, mensajesNew] = await Promise.all([
        supabase.from("notificaciones").select("*").order("created_at", { ascending: false }).limit(20) as unknown as Promise<{ data: NotifDb[] | null }>,
        supabase.from("pedidos").select("id, created_at").eq("estado", "pendiente_cotizacion").order("created_at", { ascending: false }).limit(5) as unknown as Promise<{ data: PedidoDb[] | null }>,
        supabase.from("mensajes").select("id, asunto, created_at").eq("leido", false).neq("nombre", "Admin").order("created_at", { ascending: false }).limit(5) as unknown as Promise<{ data: MensajeDb[] | null }>,
      ]);

      const compiled: Notification[] = [];

      notifsSys.data?.forEach((n) => {
        compiled.push({
          id: n.id,
          tipo: "Sistema",
          texto: (n.titulo ?? "Alerta") + ": " + (n.mensaje ?? ""),
          fecha: n.created_at,
          visto: n.enviado ?? false
        });
      });

      pedidosPending.data?.forEach((p) => {
        compiled.push({
          id: `P-${p.id}`,
          tipo: "Acción Requerida",
          texto: `Nuevo pedido #${p.id} pendiente de cotización`,
          fecha: p.created_at,
          pedido_id: p.id
        });
      });

      mensajesNew.data?.forEach((m) => {
        compiled.push({
          id: `M-${m.id}`,
          tipo: "Chat",
          texto: `Nuevo mensaje: ${m.asunto ?? 'Sin asunto'}`,
          fecha: m.created_at
        });
      });

      compiled.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      setNotifications(compiled.slice(0, 15));
      
      const lastCheck = localStorage.getItem("last_notif_check") ?? "0";
      const count = compiled.filter(n => new Date(n.fecha).getTime() > parseInt(lastCheck)).length;
      setUnread(count);

    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotif(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    
    const channel = supabase.channel('admin-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, () => {
        void fetchNotifications();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, () => {
        void fetchNotifications();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, () => {
        void fetchNotifications();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes' }, () => {
        void fetchNotifications();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const handleOpenNotif = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      localStorage.setItem("last_notif_check", Date.now().toString());
      setUnread(0);
    }
  };

  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const checkUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUsuario({
        id: data.user.id,
        nombre: (data.user.user_metadata as { nombre?: string } | undefined)?.nombre ?? data.user.email,
        email: data.user.email,
        avatar_url: (data.user.user_metadata as { avatar_url?: string } | undefined)?.avatar_url,
      });
    } else {
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    void checkUser();
  }, [authModalOpen, checkUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    void checkUser();
    router.push("/");
  };

  return (
    <>
      {/* 1. Header Móvil */}
      <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-[#007973] text-white flex items-center justify-between px-6 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover shadow border border-white/20"
          />
          <span className="font-black text-lg tracking-tighter uppercase">Thiart3D</span>
          <span className="bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
            Admin
          </span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-xl hover:bg-white/10 transition-all text-white"
          aria-label="Toggle Menu"
        >
          {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
      </header>

      {/* Backdrop para mobile drawer */}
      {menuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* 2. Sidebar Collapsible (Desktop) & Drawer (Mobile) */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={clsx(
          "self-stretch bg-[#007973] border-r border-[#005f5a] text-white flex flex-col justify-between transition-all duration-300 z-50 shrink-0",
          // Layout en desktop: sticky para que permanezca visible al hacer scroll pero se estire con el contenido
          "hidden lg:flex lg:sticky lg:top-0 lg:max-h-screen",
          isSidebarExpanded ? "lg:w-64" : "lg:w-20",
          // Layout en móvil como drawer
          menuOpen ? "fixed left-0 top-0 h-screen w-64 flex" : "fixed -left-64 lg:left-auto lg:top-auto"
        )}
      >
        {/* Top Header / Logo */}
        <div className={clsx(
          "flex items-center h-16 shrink-0 transition-all duration-300",
          isSidebarExpanded ? "justify-between px-4 border-b border-[#005f5a]" : "justify-center"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative p-1 bg-white/10 rounded-xl border border-white/20 shadow-md transition-transform duration-300 hover:scale-105 shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-cover"
              />
            </div>
            {isSidebarExpanded && (
              <span className="font-black text-lg tracking-tight uppercase transition-all duration-300 bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300 drop-shadow-sm select-none">
                Thiart3D <span className="text-[#00ffd5] ml-0.5 font-black text-[9px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10 tracking-widest align-middle">Admin</span>
              </span>
            )}
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className={clsx(
          "flex-1 overflow-y-auto custom-scrollbar",
          isSidebarExpanded || menuOpen ? "py-4 px-3 space-y-1" : "py-2 px-2 space-y-0.5 flex flex-col items-center"
        )}>
          {MENU.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  "flex items-center font-bold transition-all text-sm group relative",
                  isSidebarExpanded || menuOpen
                    ? "gap-3 p-3 w-full rounded-xl"
                    : "justify-center w-10 h-10 rounded-xl",
                  isActive
                    ? "bg-white text-[#007973] shadow-md"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className={clsx("w-[18px] h-[18px] shrink-0", isActive ? "text-[#007973]" : "text-white")} />
                {(isSidebarExpanded || menuOpen) && (
                  <span className="transition-opacity duration-200">{label}</span>
                )}

                {/* Tooltip on Hover when collapsed */}
                {!isSidebarExpanded && !menuOpen && (
                  <span className="absolute left-14 scale-0 transition-all rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white group-hover:scale-100 shadow-md whitespace-nowrap z-50 pointer-events-none">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Separador y botón Ir a la Tienda */}
          <div className="pt-2 mt-1 border-t border-white/10">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={clsx(
                "flex items-center font-bold transition-all text-sm group relative",
                isSidebarExpanded || menuOpen
                  ? "gap-3 p-3 w-full rounded-xl"
                  : "justify-center w-10 h-10 rounded-xl",
                "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <FiShoppingBag className="w-[18px] h-[18px] shrink-0 text-white" />
              {(isSidebarExpanded || menuOpen) && (
                <span className="transition-opacity duration-200">Ir a la Tienda</span>
              )}
              {/* Tooltip cuando está colapsado */}
              {!isSidebarExpanded && !menuOpen && (
                <span className="absolute left-14 scale-0 transition-all rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white group-hover:scale-100 shadow-md whitespace-nowrap z-50 pointer-events-none">
                  Ir a la Tienda
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Botón de Notificaciones en Sidebar */}
        <div className={clsx(
          "border-t border-[#005f5a] relative",
          isSidebarExpanded || menuOpen ? "px-3 py-2" : "px-2 py-2 flex justify-center"
        )}>
          <button
            onClick={handleOpenNotif}
            className={clsx(
              "flex items-center text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-bold rounded-xl",
              isSidebarExpanded || menuOpen
                ? "w-full gap-3 p-3"
                : "w-10 h-10 justify-center"
            )}
            title="Notificaciones"
          >
            <div className="relative">
              <FiBell className="w-5 h-5 text-white" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unread > 9 ? "+9" : unread}
                </span>
              )}
            </div>
            {(isSidebarExpanded || menuOpen) && <span>Notificaciones</span>}
          </button>

          {/* Notif Dropdown (arriba del botón en sidebar) */}
          {notifOpen && (
            <div
              ref={notifRef}
              className={clsx(
                "absolute bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 w-[300px]",
                !isSidebarExpanded ? "left-16 bottom-16" : "left-4 bottom-16"
              )}
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                   <FiBell className="w-3.5 h-3.5 text-[#00a19a]" /> Notificaciones
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {loadingNotif && notifications.length === 0 ? (
                  <div className="p-6 text-center flex flex-col items-center gap-2">
                     <div className="w-5 h-5 border-2 border-[#00a19a] border-t-transparent rounded-full animate-spin" />
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cargando...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                    Sin notificaciones
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n, i) => (
                       <Link
                         key={i}
                         href={n.pedido_id ? `/admin/pedidos?id=${n.pedido_id}` : "#"}
                         className="px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 block text-left"
                         onClick={() => setNotifOpen(false)}
                       >
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{n.tipo}</span>
                         <span className="text-xs font-bold text-slate-700 leading-snug">{n.texto}</span>
                       </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile / Auth block */}
        <div className={clsx(
          "border-t border-[#005f5a] bg-[#006964] shrink-0 transition-all duration-300",
          isSidebarExpanded || menuOpen ? "p-4" : "p-2 py-3 flex flex-col items-center gap-1"
        )}>
          {!usuario ? (
            <Button 
              variant="outline" 
              className={clsx("w-full border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl mx-auto", !isSidebarExpanded && "p-0 h-10 w-10 flex items-center justify-center")}
              onClick={() => setAuthModalOpen(true)}
            >
              {!isSidebarExpanded ? <UserCircle className="w-5 h-5" /> : "Iniciar Sesión"}
            </Button>
          ) : (
            <div className={clsx("flex flex-col", isSidebarExpanded || menuOpen ? "gap-2" : "gap-4 items-center")}>
              <div className={clsx("flex items-center", isSidebarExpanded || menuOpen ? "gap-3" : "justify-center")}>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-white flex items-center justify-center shrink-0">
                  {usuario.avatar_url ? (
                    <Image src={usuario.avatar_url} alt="Perfil" width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-[#00a19a]" />
                  )}
                </div>
                {(isSidebarExpanded || menuOpen) && (
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-white truncate">{usuario.nombre}</span>
                    <span className="text-[10px] text-white/60 truncate leading-none mt-0.5">{usuario.email}</span>
                  </div>
                )}
              </div>
              
              {/* Etiqueta de administración al lado/debajo del usuario */}
              {(isSidebarExpanded || menuOpen) && (
                <div className="flex items-center justify-between gap-2 mt-1 bg-white/10 rounded-xl px-3 py-1.5 border border-white/10">
                  <span className="bg-[#00a19a] text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-sm">
                    Administración
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="p-1 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-colors"
                    title="Cerrar sesión"
                  >
                    <FiLogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {!isSidebarExpanded && (
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-xl transition-colors"
                  title="Cerrar sesión"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <SupabaseAuth 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
          onAuth={() => setAuthModalOpen(false)} 
        />
      </aside>
    </>
  );
}