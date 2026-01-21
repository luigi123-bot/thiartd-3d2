"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import React, { useState, useEffect, useRef } from "react";
import {
  IoIosNotifications,
  IoIosSearch,
  IoIosHome,
  IoIosCube,
  IoIosColorPalette,
  IoIosPeople,
  IoIosMail,
  IoMdClose,
  IoIosCart,
  IoMdMenu,
  IoMdPerson,
  IoMdArrowDropdown,
  IoMdLogOut,
} from "react-icons/io";
import { FiSettings } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SupabaseAuth from "~/components/SupabaseAuth";

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
  const [role, setRole] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Montaje del componente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cerrar menú con ESC
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  // Obtener datos del usuario y su role
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
        // Consultar el role en la tabla usuarios
        const { data: userDb } = await supabase
          .from("usuarios")
          .select("role")
          .eq("email", data.user.email)
          .single();
        console.log("Role obtenido:", userDb?.role);
        if (userDb?.role && typeof userDb.role === "string") setRole(userDb.role);
        else setRole(null);
      } else {
        setUsuario(null);
        setRole(null);
      }
    })();
  }, [authModalOpen]);

  // Cerrar menú de avatar al hacer click fuera
  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarMenuOpen]);

  if (!isMounted) return null;

  return (
    <>
      {/* Navbar principal - Responsive */}
      <nav className="w-full border-b shadow-sm sticky top-0 z-50 bg-[#00a19a]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              <Link href="/" className="flex items-center gap-2">
                <span className="bg-[#00a19a] rounded-full p-1 shadow-md">
                  <Image
                    src="/IG%20Foto%20de%20Perfil.png"
                    alt="Logo Thiart3D"
                    width={40}
                    height={40}
                    className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full object-cover"
                  />
                </span>
                <span className="font-extrabold text-lg sm:text-xl lg:text-2xl text-white font-sans">
                  Thiart3D
                </span>
              </Link>
            </div>

            {/* Desktop Navigation - Hidden on mobile/tablet */}
            <div className="hidden xl:flex flex-1 items-center justify-center gap-6 2xl:gap-8">
              <div className="flex gap-4 2xl:gap-6">
                <Link
                  href="/"
                  className="text-white hover:text-gray-100 font-bold font-sans transition-colors text-sm 2xl:text-base whitespace-nowrap"
                >
                  Inicio
                </Link>
                <Link
                  href="/tienda/productos"
                  className="text-white hover:text-gray-100 font-bold font-sans transition-colors text-sm 2xl:text-base whitespace-nowrap"
                >
                  Productos
                </Link>
                <Link
                  href="/tienda/personalizar"
                  className="text-white hover:text-gray-100 font-bold font-sans transition-colors text-sm 2xl:text-base whitespace-nowrap"
                >
                  Personalizar
                </Link>
                <Link
                  href="/tienda/sobre-nosotros"
                  className="text-white hover:text-gray-100 font-bold font-sans transition-colors text-sm 2xl:text-base whitespace-nowrap"
                >
                  Sobre Nosotros
                </Link>
                <Link
                  href="/tienda/contacto"
                  className="text-white hover:text-gray-100 font-bold font-sans transition-colors text-sm 2xl:text-base whitespace-nowrap"
                >
                  Contacto
                </Link>
              </div>
              <div className="ml-4">
                <Input
                  placeholder="Buscar productos..."
                  className="w-56 2xl:w-72 rounded-full border border-gray-200 shadow-sm text-black placeholder:text-gray-700 px-4 py-2 focus:ring-2 focus:ring-[#00a19a] transition"
                />
              </div>
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              {/* Search icon - visible on mobile/tablet, hidden on desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden text-white hover:bg-white/10"
                onClick={() => setShowMobileSearch((v) => !v)}
                aria-label="Buscar"
              >
                <IoIosSearch className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>

              {/* Cart icon */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/tienda/carrito")}
                className="text-white hover:bg-white/10"
                aria-label="Carrito"
              >
                <IoIosCart className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>

              {/* Notifications icon */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex text-white hover:bg-white/10"
                aria-label="Notificaciones"
              >
                <IoIosNotifications className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>

              {/* Desktop Auth Buttons or User Menu */}
              {!usuario ? (
                <div className="hidden lg:flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAuthModalOpen(true)}
                    className="text-white border-white hover:bg-white hover:text-[#00a19a] text-sm"
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setAuthModalOpen(true)}
                    className="bg-white text-[#00a19a] hover:bg-gray-100 text-sm"
                  >
                    Registrarse
                  </Button>
                </div>
              ) : (
                <div className="hidden lg:block relative" ref={avatarMenuRef}>
                  <button
                    className="flex items-center gap-2 xl:gap-3 p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAvatarMenuOpen((v) => !v);
                    }}
                    type="button"
                  >
                    <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full overflow-hidden border-2 border-white bg-white flex items-center justify-center shadow-sm">
                      {usuario.avatar_url ? (
                        <Image
                          src={usuario.avatar_url}
                          alt="Perfil"
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <IoMdPerson className="w-5 h-5 xl:w-6 xl:h-6 text-[#00a19a]" />
                      )}
                    </div>
                    <div className="hidden xl:flex flex-col items-start">
                      <span className="font-semibold text-white text-sm">
                        {usuario.nombre ?? usuario.email?.split("@")[0] ?? "Usuario"}
                      </span>
                      <span className="text-xs text-white/70 max-w-[150px] truncate">
                        {usuario.email}
                      </span>
                      {/* Log visual para depuración del role */}
                      <span className="text-xs text-gray-300">role: {role ?? 'sin rol'}</span>
                    </div>
                    <IoMdArrowDropdown className="hidden xl:block w-4 h-4 text-white" />
                  </button>
                  
                  {/* Desktop User Dropdown Menu */}
                  {avatarMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
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
                              {usuario.nombre ?? usuario.email?.split("@")[0] ?? "Usuario"}
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

                        {/* Solo mostrar Panel de administración si el role es admin */}
                        {role === "admin" && (
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
                        )}

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

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden text-white hover:bg-white/10"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Abrir menú"
              >
                <IoMdMenu className="w-6 h-6 sm:w-7 sm:h-7" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Search Bar */}
        {showMobileSearch && (
          <div className="xl:hidden w-full px-4 py-3 bg-white shadow-md animate-slide-down border-t border-gray-200">
            <Input
              placeholder="Buscar productos..."
              className="w-full rounded-full border border-gray-300 shadow-sm text-black placeholder:text-gray-700 px-4 py-2 focus:ring-2 focus:ring-[#00a19a] transition"
              autoFocus
            />
          </div>
        )}
      </nav>

      {/* Mobile/Tablet Sidebar Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 xl:hidden"
          onClick={() => setMenuOpen(false)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

          {/* Sidebar */}
          <div
            ref={sidebarRef}
            tabIndex={0}
            className="absolute top-0 left-0 h-full w-4/5 max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Menú de navegación"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 bg-[#00a19a] border-b border-[#007973]">
              <div className="flex items-center gap-2">
                <span className="bg-white rounded-full p-1 shadow-md">
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
              </div>
              <button
                aria-label="Cerrar menú"
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
                onClick={() => setMenuOpen(false)}
              >
                <IoMdClose className="w-6 h-6" />
              </button>
            </div>

            {/* User Section (if logged in) */}
            {usuario && (
              <div className="p-4 bg-gradient-to-r from-[#00a19a]/10 to-[#007973]/10 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#00a19a] bg-white flex items-center justify-center shadow-sm">
                    {usuario.avatar_url ? (
                      <Image
                        src={usuario.avatar_url}
                        alt="Perfil"
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <IoMdPerson className="w-8 h-8 text-[#00a19a]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {usuario.nombre ?? usuario.email?.split("@")[0] ?? "Usuario"}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {usuario.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-4">
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-[#e0f2f1] hover:text-[#00a19a] transition font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  <IoIosHome className="w-6 h-6" />
                  <span>Inicio</span>
                </Link>
                <Link
                  href="/tienda/productos"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-[#e0f2f1] hover:text-[#00a19a] transition font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  <IoIosCube className="w-6 h-6" />
                  <span>Productos</span>
                </Link>
                <Link
                  href="/tienda/personalizar"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-[#e0f2f1] hover:text-[#00a19a] transition font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  <IoIosColorPalette className="w-6 h-6" />
                  <span>Personalizar</span>
                </Link>
                <Link
                  href="/tienda/sobre-nosotros"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-[#e0f2f1] hover:text-[#00a19a] transition font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  <IoIosPeople className="w-6 h-6" />
                  <span>Sobre Nosotros</span>
                </Link>
                <Link
                  href="/tienda/contacto"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-[#e0f2f1] hover:text-[#00a19a] transition font-semibold"
                  onClick={() => setMenuOpen(false)}
                >
                  <IoIosMail className="w-6 h-6" />
                  <span>Contacto</span>
                </Link>
              </div>

              {/* User Actions */}
              {usuario && (
                <>
                  <div className="my-4 border-t border-gray-200"></div>
                  <div className="space-y-1">
                    <button
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-[#e0f2f1] hover:text-[#00a19a] transition font-semibold text-left"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/tienda/mi-perfil");
                      }}
                    >
                      <IoMdPerson className="w-6 h-6" />
                      <span>Mi Perfil</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-[#e0f2f1] hover:text-[#00a19a] transition font-semibold text-left"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/envios");
                      }}
                    >
                      <IoIosCube className="w-6 h-6" />
                      <span>Mis Pedidos</span>
                    </button>
                    {/* Solo mostrar Panel Admin en mobile si el role es admin */}
                    {role === "admin" && (
                      <button
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-[#e0f2f1] hover:text-[#00a19a] transition font-semibold text-left"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/admin");
                        }}
                      >
                        <FiSettings className="w-6 h-6" />
                        <span>Panel Admin</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {!usuario ? (
                <div className="space-y-2">
                  <Button
                    variant="default"
                    className="w-full bg-[#00a19a] hover:bg-[#007973] text-white font-semibold"
                    onClick={() => {
                      setMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-[#00a19a] text-[#00a19a] hover:bg-[#e0f2f1] font-semibold"
                    onClick={() => {
                      setMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                  >
                    Registrarse
                  </Button>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center justify-center gap-2"
                  onClick={async () => {
                    setMenuOpen(false);
                    await supabase.auth.signOut();
                    router.push("/");
                  }}
                >
                  <IoMdLogOut className="w-5 h-5" />
                  <span>Cerrar sesión</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <SupabaseAuth
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onAuth={() => setAuthModalOpen(false)}
      />

      {/* Animations */}
      <style jsx global>{`
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
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
    </>
  );
}