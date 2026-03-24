"use client";
import Link from "next/link";
import {
  FiBox,
  FiUsers,
  FiLayers,
  FiTruck,
  FiShoppingCart,
  FiMessageCircle,
  FiHome,
  FiBell,
  FiMenu,
  FiX,
} from "react-icons/fi";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SupabaseAuth from "~/components/SupabaseAuth";
import { UserCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "~/components/ui/button";

const MENU = [
  { href: "/admin", label: "Inicio", icon: FiHome },
  { href: "/admin/productos", label: "Productos", icon: FiBox },
  { href: "/admin/usuarios", label: "Usuarios", icon: FiUsers },
  { href: "/admin/inventario", label: "Inventario", icon: FiLayers },
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

export default function AdminTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  const fetchNotifications = useCallback(async () => {
    setLoadingNotif(true);
    try {
      const [notifsSys, pedidosPending, mensajesNew] = await Promise.all([
        supabase.from("notificaciones").select("*").order("created_at", { ascending: false }).limit(20) as unknown as Promise<{ data: NotifDb[] | null }>,
        supabase.from("pedidos").select("id, created_at").eq("estado", "pendiente_cotizacion").order("created_at", { ascending: false }).limit(5) as unknown as Promise<{ data: PedidoDb[] | null }>,
        supabase.from("mensajes").select("id, asunto, created_at").eq("leido", false).neq("nombre", "Admin").order("created_at", { ascending: false }).limit(5) as unknown as Promise<{ data: MensajeDb[] | null }>,
      ]);

      const compiled: Notification[] = [];

      // Sistema
      notifsSys.data?.forEach((n) => {
        compiled.push({
          id: n.id,
          tipo: "Sistema",
          texto: (n.titulo ?? "Alerta") + ": " + (n.mensaje ?? ""),
          fecha: n.created_at,
          visto: n.enviado ?? false
        });
      });

      // Pedidos que requieren atención
      pedidosPending.data?.forEach((p) => {
        compiled.push({
          id: `P-${p.id}`,
          tipo: "Acción Requerida",
          texto: `Nuevo pedido #${p.id} pendiente de cotización`,
          fecha: p.created_at,
          pedido_id: p.id
        });
      });

      // Mensajes
      mensajesNew.data?.forEach((m) => {
        compiled.push({
          id: `M-${m.id}`,
          tipo: "Chat",
          texto: `Nuevo mensaje: ${m.asunto ?? 'Sin asunto'}`,
          fecha: m.created_at
        });
      });

      // Ordenar y guardar
      compiled.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      setNotifications(compiled.slice(0, 15));
      
      // Calcular no leídos basándose en localStorage
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
    
    // Escuchar cambios en tiempo real
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

  useEffect(() => {
    void (async () => {
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
    })();
  }, [authModalOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-[#00a19a] shadow-md">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/IG%20Foto%20de%20Perfil.png"
              alt="Logo Thiart3D"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover shadow"
              priority
            />
            <span className="font-black text-xl text-white tracking-tighter uppercase">
              Thiart3D <span className="text-white ml-1">Admin</span>
            </span>
          </div>
          <nav className="hidden lg:flex gap-1 items-center ml-8">
            {MENU.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                  pathname === href 
                    ? "bg-white/20 text-white shadow-inner" 
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded font-bold bg-[#00a19a] text-white hover:bg-[#00968e] transition"
            >
              <FiHome className="w-5 h-5" />
              Ir a la tienda
            </Link>
          </nav>
          <div className="flex items-center gap-4 ml-4 relative">
            <div className="relative">
              <button
                className="relative p-2 rounded-xl h-10 w-10 flex items-center justify-center hover:bg-white/20 transition-all text-white"
                aria-label="Notificaciones"
                onClick={handleOpenNotif}
              >
                <FiBell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 border-2 border-[#00a19a] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unread > 9 ? "+9" : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  ref={notifRef}
                  className="absolute right-0 top-full mt-4 w-[350px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                       <FiBell className="w-4 h-4 text-[#00a19a]" /> Notificaciones
                    </span>
                    {unread > 0 && (
                        <span className="text-[10px] bg-[#00a19a]/10 text-[#00a19a] px-2 py-0.5 rounded-full font-bold">
                            NUEVAS
                        </span>
                    )}
                  </div>
                  <div className="max-h-[450px] overflow-y-auto">
                    {loadingNotif && notifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center gap-3">
                         <div className="w-6 h-6 border-2 border-[#00a19a] border-t-transparent rounded-full animate-spin" />
                         <span className="text-xs text-slate-400 font-medium tracking-wide">Sincronizando...</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-12 text-center flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                            <FiBell className="w-6 h-6" />
                        </div>
                        <span className="text-sm text-slate-400 font-medium">Bandeja de entrada limpia</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((n, i) => (
                           <Link
                             key={i}
                             href={n.pedido_id ? `/admin/pedidos?id=${n.pedido_id}` : "#"}
                             className="px-5 py-4 hover:bg-slate-50 transition-colors flex flex-col gap-1 group block"
                             onClick={() => setNotifOpen(false)}
                           >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                    n.tipo === 'Acción Requerida' ? 'bg-amber-100 text-amber-700' : 
                                    n.tipo === 'Chat' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {n.tipo}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {new Date(n.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-slate-700 leading-snug group-hover:text-[#00a19a] transition-colors">
                                {n.texto}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.fecha).toLocaleDateString()}
                            </span>
                           </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 text-center bg-slate-50/30">
                     <button className="text-[11px] font-bold text-slate-400 hover:text-[#00a19a] transition-colors uppercase tracking-widest">
                        Cargar más
                     </button>
                  </div>
                </div>
              )}
            </div>
            {!usuario ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAuthModalOpen(true)}>
                  Entrar
                </Button>
                <Button variant="default" size="sm" onClick={() => setAuthModalOpen(true)}>
                  Registro
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center shadow-sm">
                  {usuario.avatar_url ? (
                    <Image src={usuario.avatar_url} alt="Perfil" width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-[#00a19a]" />
                  )}
                </div>
                <span className="hidden sm:inline font-bold text-white text-sm truncate max-w-[120px]">{usuario.nombre}</span>
              </div>
            )}
            <button
              className="lg:hidden p-2 rounded-xl text-white hover:bg-white/20 transition-all"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <FiX className="w-7 h-7" /> : <FiMenu className="w-7 h-7" />}
            </button>
          </div>
        </div>
        <nav
          className={`lg:hidden bg-white shadow-xl transition-all duration-300 ${
            menuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          } overflow-hidden`}
        >
          <div className="flex flex-col gap-1 px-6 pb-6 pt-4">
            {MENU.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all ${
                  pathname === href ? "bg-slate-100 text-[#00a19a]" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon className="w-5 h-5 text-[#00a19a]" />
                {label}
              </Link>
            ))}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black bg-[#00a19a] text-white hover:bg-[#00968e] transition shadow-lg mt-4"
              onClick={() => setMenuOpen(false)}
            >
              <FiHome className="w-5 h-5" />
              Tienda Virtual
            </Link>
          </div>
        </nav>
        
        <SupabaseAuth 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
          onAuth={() => setAuthModalOpen(false)} 
        />
      </header>
      <div className="pt-[64px] lg:pt-[60px]" />
    </>
  );
}