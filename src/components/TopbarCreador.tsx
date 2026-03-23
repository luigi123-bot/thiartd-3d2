"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import React, { useState, useEffect } from "react";
import { 
  IoMdMenu, IoMdPerson, IoMdLogOut 
} from "react-icons/io";
import { 
  FiBell, FiHome, FiPackage, FiArrowLeft 
} from "react-icons/fi";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "~/lib/supabaseClient";

interface TopbarCreadorProps {
  user: {
    id: string;
    nombre: string;
    email: string;
    avatar_url?: string;
  };
  // Callbacks opcionales para cuando se usa dentro del Dashboard
  onViewChange?: (view: string) => void;
  onOpenAddProduct?: () => void;
}

export default function TopbarCreador({ user, onViewChange, onOpenAddProduct: _onOpenAddProduct }: TopbarCreadorProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    window.location.reload();
  };

  const handlePanelClick = () => {
    if (pathname === "/creador") {
      onViewChange?.("stats");
    } else {
      router.push("/creador");
    }
    setMenuOpen(false);
  };

  const handleObrasClick = () => {
    router.push("/creador/productos");
    setMenuOpen(false);
  };

  return (
    <nav className="w-full border-b shadow-md sticky top-0 z-50 bg-[#00a19a]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 min-w-max group">
            <span className="bg-white rounded-full p-1 shadow-md group-hover:scale-105 transition-transform">
              <Image 
                src="/IG%20Foto%20de%20Perfil.png" 
                alt="Logo" 
                width={40} 
                height={40} 
                className="h-8 w-8 lg:h-10 lg:w-10 rounded-full object-cover" 
              />
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg lg:text-xl text-white leading-none">Thiart3D</span>
              <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mt-0.5">Centro Creador</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
             <button 
                onClick={handlePanelClick}
                className={`flex items-center gap-2 text-white px-4 py-2 rounded-xl transition-all font-bold ${pathname === "/creador" ? "bg-white/20" : "hover:bg-white/10"}`}
             >
                <FiHome className="w-4 h-4" />
                Panel
             </button>
             <button 
                onClick={handleObrasClick}
                className={`flex items-center gap-2 text-white px-4 py-2 rounded-xl transition-all font-bold ${pathname === "/creador/productos" ? "bg-white/20" : "hover:bg-white/10"}`}
             >
                <FiPackage className="w-4 h-4" />
                Mis Obras
             </button>
             <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white px-4 py-2 transition-all font-bold text-sm">
                <FiArrowLeft className="w-4 h-4" />
                Ir a la Tienda
             </Link>
          </div>

          {/* User & Options */}
          <div className="flex items-center gap-2 lg:gap-4">
             <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
                <FiBell className="w-6 h-6" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full border-2 border-[#00a19a]"></span>
             </Button>

             {/* User Profile */}
             <div className="relative group">
                <button 
                  onClick={() => setAvatarMenuOpen(!avatarMenuOpen)} 
                  className="flex items-center gap-2 p-1 pl-2 pr-2 sm:pr-4 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                >
                  <div className="hidden sm:flex flex-col items-end mr-2 leading-none">
                    <span className="text-xs font-black text-white">{user.nombre.split(' ')[0]}</span>
                    <span className="text-[8px] text-white/60 font-bold uppercase tracking-widest mt-0.5">Creador</span>
                  </div>
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border-2 border-white overflow-hidden bg-white flex items-center justify-center shadow-sm">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <IoMdPerson className="w-5 h-5 lg:w-6 lg:h-6 text-[#00a19a]" />
                    )}
                  </div>
                </button>

                {avatarMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border rounded-2xl shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in zoom-in-95 origin-top-right">
                    <div className="px-4 py-2 border-b mb-1">
                      <div className="font-bold text-slate-800 truncate">{user.nombre}</div>
                      <div className="text-[10px] text-slate-400 truncate tracking-tight">{user.email}</div>
                    </div>
                    <button onClick={() => router.push("/")} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-bold text-slate-600 transition-colors">
                      <FiArrowLeft className="text-[#00a19a]" /> Volver a Tienda
                    </button>
                    <button 
                      onClick={() => {
                        router.push("/creador/productos");
                        setAvatarMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-bold text-slate-600 transition-colors"
                    >
                      <FiPackage className="text-[#00a19a]" /> Gestionar Obras
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm font-bold transition-colors"
                    >
                      <IoMdLogOut /> Cerrar Sesión
                    </button>
                  </div>
                )}
             </div>

             {/* Mobile Menu Toggle */}
             <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
                <IoMdMenu className="w-7 h-7" />
             </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`lg:hidden bg-white border-t transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="p-4 flex flex-col gap-2">
           <button 
              onClick={handlePanelClick}
              className={`px-4 py-3 font-black rounded-xl border flex items-center gap-3 ${pathname === "/creador" ? "bg-[#00a19a]/10 text-[#00a19a] border-[#00a19a]/20" : "text-slate-600 border-transparent hover:bg-slate-50"}`}
           >
              <FiHome /> Panel de Control
           </button>
           <button 
              onClick={handleObrasClick}
              className={`px-4 py-3 font-black rounded-xl border flex items-center gap-3 ${pathname === "/creador/productos" ? "bg-[#00a19a]/10 text-[#00a19a] border-[#00a19a]/20" : "text-slate-600 border-transparent hover:bg-slate-50"}`}
           >
              <FiPackage /> Mis Obras Publicadas
           </button>
           <Link href="/" className="px-4 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl flex items-center gap-3">
              <FiArrowLeft /> Ver Tienda Pública
           </Link>
           <hr className="my-2 border-slate-100" />
           <button onClick={handleLogout} className="px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl flex items-center gap-3">
              <IoMdLogOut /> Cerrar Sesión
           </button>
        </div>
      </div>
    </nav>
  );
}
