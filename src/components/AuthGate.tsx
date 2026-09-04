"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "~/lib/supabaseClient";
import { Button } from "~/components/ui/button";
import { FiStar, FiArrowRight, FiShield } from "react-icons/fi";

// Modales pesados — se cargan solo cuando son necesarios
const ContactModal = dynamic(() => import("./ContactModal"), { ssr: false });
const UsuariosAdminModal = dynamic(() => import("./UsuariosAdminModal"), { ssr: false });

interface AuthGateProps {
  becomeCreatorModalOpen: boolean;
  setBecomeCreatorModalOpen: (open: boolean) => void;
}

export default function AuthGate({ becomeCreatorModalOpen: _becomeCreatorModalOpen, setBecomeCreatorModalOpen }: AuthGateProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [supaRole, setSupaRole] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkRole() {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      if (currentUserId) {
        const { data: userDb } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", currentUserId)
          .single() as { data: { role: string } | null };
        if (userDb?.role) {
          const r = userDb.role.toLowerCase();
          if (mounted) {
            setSupaRole(r);
            if (r === "admin") setIsAdmin(true);
          }
        }
      } else if (mounted) {
        setSupaRole(null);
        setIsAdmin(false);
      }
    }
    void checkRole();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void checkRole();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* ─── Banner Creadores (solo para clientes / no logueados) ── */}
      {(!supaRole || supaRole === "cliente") && (
        <section className="py-20 md:py-32 px-4 bg-slate-50 relative">
          <div
            className="max-w-7xl mx-auto bg-gradient-to-br from-[#00a19a] via-[#008f89] to-[#00605c] rounded-[3rem] p-10 md:p-16 shadow-[0_20px_50px_-12px_rgba(0,161,154,0.4)] overflow-hidden relative"
          >
            <div className="absolute -top-10 -right-10 p-8 opacity-10">
              <FiStar className="w-96 h-96 text-white rotate-12" />
            </div>
            <div className="absolute -bottom-10 -left-10 p-8 opacity-5">
              <FiStar className="w-64 h-64 text-white -rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="text-center lg:text-left lg:w-3/5">
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-[0.2em] mb-6 shadow-xl">
                  <FiShield className="w-4 h-4" /> Programa de Creadores Oficial
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                  ¿Eres artista 3D? <br className="hidden md:block" />
                  <span className="text-teal-200">Únete a Thiart</span>
                </h2>
                <p className="text-teal-50 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-medium">
                  Convierte tus diseños en un ingreso constante. Tú haces el arte digital, nosotros nos encargamos de la producción 3D física, envíos y atención al cliente.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Button
                    onClick={() => setBecomeCreatorModalOpen(true)}
                    className="w-full sm:w-auto bg-white text-[#007973] hover:bg-teal-50 px-10 py-7 rounded-2xl font-black text-base uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                  >
                    Postularme Ahora <FiArrowRight className="w-5 h-5" />
                  </Button>
                  <p className="text-xs text-teal-100 font-bold uppercase tracking-widest mt-4 sm:mt-0 sm:ml-4 bg-black/10 px-4 py-2 rounded-xl">Evaluación en 48h</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:w-2/5 w-full">
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-center shadow-xl shadow-black/10">
                  <div className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-md">+100</div>
                  <div className="text-xs text-teal-100 font-bold uppercase tracking-widest">Modelos Únicos</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-center shadow-xl shadow-black/10">
                  <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-500 mb-2 drop-shadow-md">Top</div>
                  <div className="text-xs text-teal-100 font-bold uppercase tracking-widest">Artistas Globales</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Modales ─────────────────────────────── */}
      <ContactModal open={modalOpen} onOpenChangeAction={setModalOpen} />

      {isAdmin && (
        <>
          <Button
            onClick={() => setUsuariosModalOpen(true)}
            className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[100] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 md:px-8 font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all active:scale-95 text-xs"
          >
            <span className="hidden lg:inline">Gestión Especializada</span>
            <span className="lg:hidden">Admin</span>
          </Button>
          <UsuariosAdminModal open={usuariosModalOpen} onOpenChange={setUsuariosModalOpen} />
        </>
      )}
    </>
  );
}
