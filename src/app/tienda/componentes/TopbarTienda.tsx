"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  IoIosSearch,
  IoIosCart,
  IoMdMenu,
  IoMdPerson,
  IoMdLogOut,
} from "react-icons/io";
import { FiSettings, FiBell } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { useCarrito } from "~/components/providers/CarritoProvider";
import SupabaseAuth from "~/components/SupabaseAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface UserNotification {
    id: string | number;
    titulo: string;
    mensaje: string;
    created_at: string;
}

export default function TopbarTienda() {
  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [usuario, setUsuario] = useState<{ id?: string; nombre?: string; email?: string; avatar_url?: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { carrito } = useCarrito();
  const cartCount = carrito.reduce((acc, item) => acc + (item.cantidad ?? 0), 0);
  const router = useRouter();

  useEffect(() => { setIsMounted(true); }, []);

  const fetchUserNotifications = useCallback(async (userId: string) => {
    setLoadingNotif(true);
    try {
      const { data } = await supabase
        .from("notificaciones")
        .select("*")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false })
        .limit(10) as { data: UserNotification[] | null };
      
      const list = data ?? [];
      setNotifications(list);

      const lastCheck = localStorage.getItem(`last_notif_check_${userId}`) ?? "0";
      const count = list.filter(n => new Date(n.created_at).getTime() > parseInt(lastCheck)).length;
      setUnread(count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotif(false);
    }
  }, []);

  const handleOpenNotif = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && usuario?.id) {
      localStorage.setItem(`last_notif_check_${usuario.id}`, Date.now().toString());
      setUnread(0);
    }
  };

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUsuario({
          id: data.user.id,
          nombre: (data.user.user_metadata?.nombre as string) ?? data.user.email,
          email: data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url as string,
        });

        const { data: userDb } = await supabase
          .from("usuarios")
          .select("role")
          .eq("email", data.user.email)
          .single() as { data: { role: string } | null };
        if (userDb?.role) setRole(userDb.role);
        
        // Cargar notificaciones
        void fetchUserNotifications(data.user.id);
        
        // Listen Real-time
        channel = supabase.channel(`user-notifs-${data.user.id}`)
          .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'notificaciones', 
              filter: `usuario_id=eq.${data.user.id}` 
          }, () => {
            void fetchUserNotifications(data.user.id);
          })
          .subscribe();
      } else {
        setUsuario(null);
        setRole(null);
      }
    })();
    
    return () => {
        if (channel) void supabase.removeChannel(channel);
    };
  }, [authModalOpen, fetchUserNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  if (!isMounted) return null;

  return (
    <>
      <nav className="w-full border-b shadow-sm sticky top-0 z-50 bg-[#00a19a]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 min-w-max">
              <span className="bg-white rounded-full p-1 shadow-md">
                <Image src="/IG%20Foto%20de%20Perfil.png" alt="Logo" width={40} height={40} className="h-8 w-8 lg:h-10 lg:w-10 rounded-full object-cover" />
              </span>
              <span className="font-extrabold text-lg lg:text-2xl text-white">Thiart3D</span>
            </Link>

            <div className="hidden xl:flex flex-1 items-center justify-center gap-8">
              <Link href="/" className="text-white hover:text-gray-100 font-bold transition-colors">Inicio</Link>
              <Link href="/tienda/personalizar" className="text-white hover:text-gray-100 font-bold transition-colors">Personalizar</Link>
              <Link href="/tienda/productos" className="text-white hover:text-gray-100 font-bold transition-colors">Productos</Link>
              <Link href="/tienda/sobre-nosotros" className="text-white hover:text-gray-100 font-bold transition-colors">Nosotros</Link>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <Button variant="ghost" size="icon" className="xl:hidden text-white hover:bg-white/10" onClick={() => setShowMobileSearch(!showMobileSearch)}>
                <IoIosSearch className="w-6 h-6" />
              </Button>

              <Button variant="ghost" size="icon" onClick={() => router.push("/tienda/carrito")} className="text-white hover:bg-white/10 relative">
                <IoIosCart className="w-6 h-6" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#00a19a]">{cartCount}</span>}
              </Button>

              <div className="relative" ref={notifRef}>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative" onClick={handleOpenNotif}>
                  <FiBell className="w-6 h-6" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#00a19a] animate-pulse">
                      {unread}
                    </span>
                  )}
                </Button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[320px] bg-white border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b bg-slate-50 font-bold text-slate-800 flex justify-between items-center">
                      Notificaciones
                      <span className="text-[10px] bg-[#00a19a] text-white px-2 py-0.5 rounded-full">Recientes</span>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      {loadingNotif && notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">Sincronizando...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-300">No hay notificaciones</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className="p-4 border-b hover:bg-slate-50 transition-colors">
                            <div className="text-[10px] font-black text-[#00a19a] uppercase tracking-widest">{n.titulo}</div>
                            <div className="text-sm text-slate-700 font-medium leading-tight my-1">{n.mensaje}</div>
                            <div className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link href="/envios" className="block text-center p-3 text-xs font-bold text-[#00a19a] bg-slate-50 hover:bg-slate-100 transition-colors" onClick={() => setNotifOpen(false)}>
                      Ver todos mis pedidos
                    </Link>
                  </div>
                )}
              </div>

              {!usuario ? (
                <div className="hidden lg:flex items-center gap-2">
                   <Button variant="outline" onClick={() => setAuthModalOpen(true)} className="text-white border-white hover:bg-white hover:text-[#00a19a]">Entrar</Button>
                   <Button variant="default" onClick={() => setAuthModalOpen(true)} className="bg-white text-[#00a19a] hover:bg-gray-100">Registrarse</Button>
                </div>
              ) : (
                <div className="relative group">
                  <button onClick={() => setAvatarMenuOpen(!avatarMenuOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition">
                    <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-white flex items-center justify-center shadow-sm">
                      {usuario.avatar_url ? <Image src={usuario.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" /> : <IoMdPerson className="w-6 h-6 text-[#00a19a]" />}
                    </div>
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border rounded-xl shadow-xl z-50 overflow-hidden py-2 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 border-b mb-1">
                        <div className="font-bold text-slate-800 truncate">{usuario.nombre}</div>
                        <div className="text-[10px] text-slate-400 truncate">{usuario.email}</div>
                      </div>
                      <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-sm" onClick={() => { setAvatarMenuOpen(false); router.push("/tienda/mi-perfil"); }}><IoMdPerson className="text-[#00a19a]" /> Perfil</button>
                      <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-sm" onClick={() => { setAvatarMenuOpen(false); router.push("/envios"); }}><IoMdPerson className="text-[#00a19a]" /> Pedidos</button>
                      {role === "admin" && <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-sm text-[#00a19a] font-bold" onClick={() => { setAvatarMenuOpen(false); router.push("/admin"); }}><FiSettings /> Admin</button>}
                      <hr className="my-1" />
                      <button className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm" onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}><IoMdLogOut /> Salir</button>
                    </div>
                  )}
                </div>
              )}

              <Button variant="ghost" size="icon" className="xl:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
                <IoMdMenu className="w-7 h-7" />
              </Button>
            </div>
          </div>
        </div>

        {showMobileSearch && (
          <div className="xl:hidden px-4 py-3 bg-white border-t animate-slide-down">
            <Input placeholder="Buscar..." className="rounded-full shadow-sm text-black" autoFocus />
          </div>
        )}
      </nav>

      <SupabaseAuth open={authModalOpen} onOpenChange={setAuthModalOpen} onAuth={() => setAuthModalOpen(false)} />
    </>
  );
}