import Link from "next/link";
import {
  FiBox,
  FiUsers,
  FiLayers,
  FiTruck,
  FiShoppingCart,
  FiMessageCircle,
  FiHome,
  FiAlertCircle,
  FiBell,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SupabaseAuth from "~/components/SupabaseAuth";
import { UserCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Truck } from "lucide-react";

const MENU = [
  { href: "/admin/productos", label: "Productos", icon: FiBox },
  { href: "/admin/usuarios", label: "Usuarios", icon: FiUsers },
  { href: "/admin/inventario", label: "Inventario", icon: FiLayers },
  { href: "/admin/envios", label: "Envíos", icon: FiTruck },
  { href: "/admin/pedidos", label: "Pedidos", icon: FiShoppingCart },
  { href: "/admin/tickets", label: "Tickets", icon: FiAlertCircle },
  { href: "/admin/mensajes", label: "Mensajes", icon: FiMessageCircle },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  type Notification = {
    tipo: string;
    texto: string;
    fecha: string;
  };
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

  // Cargar notificaciones de productos, envíos, pedidos, mensajes, etc.
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoadingNotif(true);
      // Ejemplo: puedes adaptar la consulta según tu modelo de datos
      const [productos, envios, pedidos, mensajes] = await Promise.all([
        supabase
          .from("productos")
          .select("id, nombre, created_at")
          .order("created_at", { ascending: false })
          .limit(2),
        supabase
          .from("envios")
          .select("id, estado, created_at")
          .order("created_at", { ascending: false })
          .limit(2),
        supabase
          .from("pedidos")
          .select("id, estado, created_at")
          .order("created_at", { ascending: false })
          .limit(2),
        supabase
          .from("mensajes")
          .select("id, asunto, created_at")
          .order("created_at", { ascending: false })
          .limit(2),
      ]);
      const notifs: Notification[] = [];
      productos.data?.forEach((p: { id: number; nombre: string; created_at: string }) =>
        notifs.push({
          tipo: "Producto",
          texto: `Nuevo producto: ${p.nombre}`,
          fecha: p.created_at,
        })
      );
      envios.data?.forEach((e: { id: number; estado: string; created_at: string }) =>
        notifs.push({
          tipo: "Envío",
          texto: `Nuevo envío: #${e.id} (${e.estado})`,
          fecha: e.created_at,
        })
      );
      pedidos.data?.forEach((p: { id: number; estado: string; created_at: string }) =>
        notifs.push({
          tipo: "Pedido",
          texto: `Nuevo pedido: #${p.id} (${p.estado})`,
          fecha: p.created_at,
        })
      );
      mensajes.data?.forEach((m: { id: number; asunto?: string; created_at: string }) =>
        notifs.push({
          tipo: "Mensaje",
          texto: `Nuevo mensaje: ${m.asunto ?? "Sin asunto"}`,
          fecha: m.created_at,
        })
      );
      // Ordenar por fecha descendente y limitar a 10
      notifs.sort(
        (a, b) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      setNotifications(notifs.slice(0, 10));
      setUnread(notifs.length); // Puedes mejorar esto con un campo "leído"
      setLoadingNotif(false);
    };
    if (notifOpen) void fetchNotifications();
  }, [notifOpen]);

  // Cerrar popup al hacer click fuera
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
          {/* Logo y nombre */}
          <div className="flex items-center gap-3">
            <Image
              src="/IG%20Foto%20de%20Perfil.png"
              alt="Logo Thiart3D"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover shadow"
              priority
            />
            <span className="font-extrabold text-xl text-gray-800">
              Thiart3D Admin
            </span>
          </div>
          {/* Menú horizontal */}
          <nav className="hidden lg:flex gap-4 items-center ml-8">
            {MENU.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded font-semibold text-gray-800 hover:bg-slate-100 transition-all ${
                  pathname === href ? "bg-slate-100 text-[#00a19a]" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
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
          {/* Accesos rápidos */}
          <div className="flex items-center gap-4 ml-4 relative">
            <div className="relative">
              <button
                className="relative p-2 rounded-full hover:bg-slate-100 transition"
                aria-label="Notificaciones"
                onClick={() => setNotifOpen((v) => !v)}
              >
                <FiBell className="w-5 h-5 text-gray-700" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
              {/* Popup notificaciones */}
              {notifOpen && (
                <div
                  ref={notifRef}
                  className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in"
                >
                  <div className="px-4 py-2 border-b font-semibold text-gray-700 bg-slate-50">
                    Notificaciones
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotif ? (
                      <div className="p-4 text-center text-gray-400">
                        Cargando...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        Sin notificaciones recientes
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <div
                          key={i}
                          className="px-4 py-3 border-b last:border-b-0 flex flex-col"
                        >
                          <span className="text-sm font-semibold text-[#00a19a]">
                            {n.tipo}
                          </span>
                          <span className="text-sm text-gray-800">{n.texto}</span>
                          <span className="text-xs text-gray-400 mt-1">
                            {new Date(n.fecha).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {!usuario ? (
              <>
                <Button variant="outline" onClick={() => setAuthModalOpen(true)}>
                  Iniciar sesión
                </Button>
                <Button variant="default" onClick={() => setAuthModalOpen(true)}>
                  Registrarse
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center">
                  {usuario.avatar_url ? (
                    <Image src={usuario.avatar_url} alt="Perfil" width={40} height={40} className="object-cover w-10 h-10" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-[#00a19a]" />
                  )}
                </div>
                <span className="font-semibold text-white">{usuario.nombre}</span>
              </div>
            )}
            {/* Menú hamburguesa */}
            <button
              className="lg:hidden p-2 rounded hover:bg-slate-100 transition"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <FiX className="w-7 h-7" />
              ) : (
                <FiMenu className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>
        {/* Menú móvil */}
        <nav
          className={`lg:hidden bg-white shadow transition-all duration-300 ${
            menuOpen
              ? "max-h-[600px] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"
          } overflow-hidden`}
        >
          <div className="flex flex-col gap-1 px-6 pb-4 pt-2">
            {MENU.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded font-semibold text-gray-800 hover:bg-slate-100 transition-all ${
                  pathname === href ? "bg-slate-100 text-[#00a19a]" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded font-bold bg-[#00a19a] text-white hover:bg-[#00968e] transition mt-2"
              onClick={() => setMenuOpen(false)}
            >
              <FiHome className="w-5 h-5" />
              Ir a la tienda
            </Link>
            <Link
              href="/admin/tracking"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Truck className="w-5 h-5 text-gray-600" />
              <span>Tracking de Envíos</span>
            </Link>
          </div>
        </nav>
        
        {/* Modal de autenticación usando Dialog */}
        <SupabaseAuth 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
          onAuth={() => setAuthModalOpen(false)} 
        />
      </header>
      {/* Espacio para el header */}
      <div className="pt-[64px] lg:pt-[60px]" />
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeInCard 0.3s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeInCard {
          from { opacity: 0; transform: translateY(-12px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </>
  );
}