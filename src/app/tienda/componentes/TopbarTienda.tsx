"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import React from "react";
import {
  IoIosNotifications,
  IoIosSearch,
  IoIosHome,
  IoIosCube,
  IoIosColorPalette,
  IoIosPeople,
  IoIosMail,
  IoMdClose,
} from "react-icons/io";
import {
  IoIosCart,
  IoMdMenu,
  IoMdPerson,
  IoMdArrowDropdown
} from "react-icons/io";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SupabaseAuth from "~/components/SupabaseAuth";
import { FiSettings } from "react-icons/fi";
import { IoMdLogOut } from "react-icons/io";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TopbarTienda() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [usuario, setUsuario] = useState<
    { id?: string; nombre?: string; email?: string; avatar_url?: string } | null
  >(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const router = useRouter();

  // Evitar renderizado hasta que el componente esté montado en el cliente
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Focus trap y cerrar con ESC
  React.useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Ref para focus trap
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (menuOpen && sidebarRef.current) {
      sidebarRef.current.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUsuario({
          id: data.user.id,
          nombre:
            typeof data.user.user_metadata === "object" && data.user.user_metadata !== null
              ? (data.user.user_metadata as { nombre?: string }).nombre ?? data.user.email
              : data.user.email,
          email: data.user.email,
          avatar_url:
            typeof data.user.user_metadata === "object" && data.user.user_metadata !== null
              ? (data.user.user_metadata as { avatar_url?: string }).avatar_url
              : undefined,
        });
      } else {
        setUsuario(null);
      }
    })();
  }, [authModalOpen]);

  // Cerrar menú de avatar al hacer click fuera
  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handleClick = (_: MouseEvent) => {
      setAvatarMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [avatarMenuOpen]);

  if (!isMounted) return null;

  return (
    // Simulación de vista lado a lado para desktop y móvil
    <div className="w-full flex flex-col md:flex-row md:space-x-8">
      {/* Desktop View */}
      <div className="hidden md:flex w-full">
        <nav className="w-full border-b shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-[#00a19a]">
          {/* Logo */}
          <div className="flex items-center gap-3 min-w-max">
            <Link href="/" className="flex items-center gap-2">
              <span className="bg-[#00a19a] rounded-full p-1 shadow-md">
                <Image
                  src="/IG%20Foto%20de%20Perfil.png"
                  alt="Logo Thiart3D"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </span>
              <span className="font-extrabold text-2xl text-white font-sans">
                Thiart3D
              </span>
            </Link>
          </div>
          {/* Menú central */}
          <div className="flex-1 flex items-center justify-center gap-8">
            <div className="flex gap-6">
              <Link
                href="/"
                className="text-white hover:text-gray-100 font-bold font-sans transition"
              >
                Inicio
              </Link>
              <Link
                href="/tienda/productos"
                className="text-white hover:text-gray-100 font-bold font-sans transition"
              >
                Productos
              </Link>
              <Link
                href="/tienda/personalizar"
                className="text-white hover:text-gray-100 font-bold font-sans transition"
              >
                Personalizar
              </Link>
              <Link
                href="/tienda/sobre-nosotros"
                className="text-white hover:text-gray-100 font-bold font-sans transition"
              >
                Sobre Nosotros
              </Link>
              <Link
                href="/tienda/contacto"
                className="text-white hover:text-gray-100 font-bold font-sans transition"
              >
                Contacto
              </Link>
            </div>
            <div className="ml-8">
              <Input
                placeholder="Buscar productos..."
                className="max-w-xs rounded-full border border-gray-200 shadow-sm text-black placeholder:text-gray-700 px-4 py-2 focus:ring-2 focus:ring-[#00a19a] transition"
              />
            </div>
          </div>
          {/* Iconos y sesión */}
          <div className="flex items-center gap-3 min-w-max ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/tienda/carrito")}
              className="hover:bg-[#00a19a]/20 transition"
            >
              <IoIosCart className="w-6 h-6 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[#00a19a]/20 transition"
            >
              <IoIosNotifications className="w-6 h-6 text-white" />
            </Button>
            {!usuario ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-white border-white hover:bg-white hover:text-[#00a19a]"
                >
                  Iniciar sesión
                </Button>
                <Button
                  variant="default"
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-white text-[#00a19a] hover:bg-gray-100"
                >
                  Registrarse
                </Button>
              </>
            ) : (
              <div className="relative flex items-center gap-2">
                <button
                  className="flex items-center gap-3 p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                  onClick={e => {
                    e.stopPropagation();
                    setAvatarMenuOpen(v => !v);
                  }}
                  type="button"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center shadow-sm">
                    {usuario.avatar_url ? (
                      <Image
                        src={usuario.avatar_url}
                        alt="Perfil"
                        width={40}
                        height={40}
                        className="object-cover w-10 h-10"
                      />
                    ) : (
                      <IoMdPerson className="w-6 h-6 text-[#00a19a]" />
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="font-semibold text-white text-sm">
                      {usuario.nombre ?? usuario.email?.split('@')[0] ?? 'Usuario'}
                    </span>
                    <span className="text-xs text-white/70">
                      {usuario.email}
                    </span>
                  </div>
                  <IoMdArrowDropdown className="w-4 h-4 text-white" />
                </button>
                {avatarMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Header del menú */}
                    <div className="bg-gradient-to-r from-[#00a19a] to-[#007973] p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center">
                          {usuario.avatar_url ? (
                            <Image
                              src={usuario.avatar_url}
                              alt="Perfil"
                              width={48}
                              height={48}
                              className="object-cover w-12 h-12"
                            />
                          ) : (
                            <IoMdPerson className="w-8 h-8 text-[#00a19a]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">
                            {usuario.nombre ?? usuario.email?.split('@')[0] ?? 'Usuario'}
                          </div>
                          <div className="text-xs text-white/80 truncate">
                            {usuario.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Opciones del menú */}
                    <div className="py-2">
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          router.push("/tienda/mi-perfil");
                        }}
                      >
                        <IoMdPerson className="w-5 h-5 text-[#00a19a]" />
                        <div>
                          <div className="font-medium">Mi perfil</div>
                          <div className="text-xs text-gray-500">Gestiona tu información personal</div>
                        </div>
                      </button>
                      
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          router.push("/envios");
                        }}
                      >
                        <IoIosCube className="w-5 h-5 text-[#00a19a]" />
                        <div>
                          <div className="font-medium">Mis pedidos</div>
                          <div className="text-xs text-gray-500">Ver historial de compras</div>
                        </div>
                      </button>
                      
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          router.push("/tienda/carrito");
                        }}
                      >
                        <IoIosCart className="w-5 h-5 text-[#00a19a]" />
                        <div>
                          <div className="font-medium">Mi carrito</div>
                          <div className="text-xs text-gray-500">Productos guardados</div>
                        </div>
                      </button>
                      
                      <hr className="my-2 border-gray-100" />
                      
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          router.push("/admin");
                        }}
                      >
                        <FiSettings className="w-5 h-5 text-[#00a19a]" />
                        <div>
                          <div className="font-medium">Panel de administración</div>
                          <div className="text-xs text-gray-500">Gestión de la tienda</div>
                        </div>
                      </button>
                      
                      <hr className="my-2 border-gray-100" />
                      
                      <button
                        className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                        onClick={async () => {
                          setAvatarMenuOpen(false);
                          await supabase.auth.signOut();
                          router.push("/");
                        }}
                      >
                        <IoMdLogOut className="w-5 h-5" />
                        <div>
                          <div className="font-medium">Cerrar sesión</div>
                          <div className="text-xs text-red-500">Salir de tu cuenta</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
      {/* Mobile View */}
      <div className="md:hidden w-full">
        <nav className="w-full border-b shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-[#00a19a]">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-max">
            <Link href="/" className="flex items-center gap-2">
              <span className="bg-[#00a19a] rounded-full p-1 shadow-md">
                <Image
                  src="/IG%20Foto%20de%20Perfil.png"
                  alt="Logo Thiart3D"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
              </span>
              <span className="font-extrabold text-xl text-white font-sans">
                Thiart3D
              </span>
            </Link>
          </div>
          {/* Iconos a la derecha */}
          <div className="flex items-center gap-1">
            {/* Icono de búsqueda móvil */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => setShowMobileSearch((v) => !v)}
              aria-label="Buscar"
            >
              <IoIosSearch className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/tienda/carrito")}
              className="text-white"
              aria-label="Carrito"
            >
              <IoIosCart className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              aria-label="Notificaciones"
            >
              <IoIosNotifications className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Abrir menú"
            >
              <IoMdMenu className="w-7 h-7" />
            </Button>
          </div>
        </nav>
        {/* Buscador móvil desplegable */}
        {showMobileSearch && (
          <div className="w-full px-4 py-2 bg-white shadow-md flex items-center animate-fade-in-down">
            <Input
              placeholder="Buscar productos..."
              className="w-full rounded-full border border-gray-200 shadow-sm text-black placeholder:text-gray-700 px-4 py-2 focus:ring-2 focus:ring-[#00a19a] transition"
              autoFocus
            />
          </div>
        )}
        {/* Menú móvil sidebar */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 md:hidden transition-colors"
            onClick={() => setMenuOpen(false)}
            tabIndex={-1}
          >
            <div
              ref={sidebarRef}
              tabIndex={0}
              className="absolute top-0 left-0 h-full w-4/5 max-w-xs bg-white shadow-xl border-r-4 border-[#00a19a] flex flex-col p-0 outline-none animate-slide-in-left"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Menú de navegación"
            >
              {/* Header: Logo y botón cerrar */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                <span className="bg-[#00a19a] rounded-full p-1 shadow-md flex items-center justify-center">
                  <Image
                    src="/IG%20Foto%20de%20Perfil.png"
                    alt="Logo Thiart3D"
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                </span>
                <button
                  aria-label="Cerrar menú"
                  className="text-[#00a19a] hover:bg-[#e0f2f1] rounded-full p-2 transition"
                  onClick={() => setMenuOpen(false)}
                  tabIndex={0}
                >
                  <IoMdClose className="w-7 h-7" />
                </button>
              </div>
              {/* Navegación */}
              <nav className="flex flex-col gap-2 px-4 py-6 font-bold font-sans text-[#00a19a] text-lg">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#e0f2f1] transition"
                  onClick={() => setMenuOpen(false)}
                  tabIndex={0}
                >
                  <IoIosHome className="w-6 h-6" /> Inicio
                </Link>
                <Link
                  href="/tienda/productos"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#e0f2f1] transition"
                  onClick={() => setMenuOpen(false)}
                  tabIndex={0}
                >
                  <IoIosCube className="w-6 h-6" /> Productos
                </Link>
                <Link
                  href="/tienda/personalizar"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#e0f2f1] transition"
                  onClick={() => setMenuOpen(false)}
                  tabIndex={0}
                >
                  <IoIosColorPalette className="w-6 h-6" /> Personalizar
                </Link>
                <Link
                  href="/tienda/sobre-nosotros"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#e0f2f1] transition"
                  onClick={() => setMenuOpen(false)}
                  tabIndex={0}
                >
                  <IoIosPeople className="w-6 h-6" /> Sobre Nosotros
                </Link>
                <Link
                  href="/tienda/contacto"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#e0f2f1] transition"
                  onClick={() => setMenuOpen(false)}
                  tabIndex={0}
                >
                  <IoIosMail className="w-6 h-6" /> Contacto
                </Link>
              </nav>
              {/* Sesión */}
              <div className="px-4 pb-6 mt-auto">
                {/* Aquí puedes agregar tus propios botones de login/register si usas Supabase Auth */}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Carrito Sidebar */}
      {/*
        NOTA: 
        - Para ver ambas vistas lado a lado, usa la estructura flex de arriba en un entorno de desarrollo.
        - Las clases animate-fade-in-down y animate-slide-in-left pueden implementarse con Tailwind CSS o CSS personalizado para animaciones suaves.
        - El diseño mantiene la paleta y tipografía, solo mejora la disposición y responsividad.
      */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            {/* Aquí se muestra el componente para login/registro */}
            <SupabaseAuth onAuth={() => setAuthModalOpen(false)} />
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => setAuthModalOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
      {/* Agregar estilos de animación */}
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}