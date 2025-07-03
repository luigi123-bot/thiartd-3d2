import Link from "next/link";
import Image from "next/image";
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
  FiUser,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useState } from "react";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/admin/productos", label: "Productos", icon: FiBox },
  { href: "/admin/usuarios", label: "Usuarios", icon: FiUsers },
  { href: "/admin/inventario", label: "Inventario", icon: FiLayers },
  { href: "/admin/envios", label: "Envíos", icon: FiTruck },
  { href: "/admin/pedidos", label: "Pedidos", icon: FiShoppingCart },
  { href: "/admin/tickets", label: "Tickets", icon: FiAlertCircle },
  { href: "/admin/mensajes", label: "Mensajes", icon: FiMessageCircle },
];

export default function AdminTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
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
          <div className="flex items-center gap-4 ml-4">
            <button
              className="relative p-2 rounded-full hover:bg-slate-100 transition"
              aria-label="Notificaciones"
            >
              <FiBell className="w-5 h-5 text-gray-700" />
              {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /> */}
            </button>
            <button
              className="p-2 rounded-full hover:bg-slate-100 transition"
              aria-label="Perfil"
            >
              <FiUser className="w-5 h-5 text-gray-700" />
            </button>
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
          </div>
        </nav>
      </header>
      {/* Espacio para el header */}
      <div className="pt-[64px] lg:pt-[60px]" />
    </>
  );
}