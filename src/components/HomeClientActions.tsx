"use client";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import ContactModal from "~/components/ContactModal";
import UsuariosAdminModal from "~/components/UsuariosAdminModal";
import BecomeCreatorModal from "~/components/BecomeCreatorModal";
import { supabase } from "~/lib/supabaseClient";
import { FiPackage } from "react-icons/fi";
import Link from "next/link";

/**
 * Componente cliente liviano que maneja:
 * - Estado de sesión / rol del usuario
 * - Modales (contacto, admin, creador)
 * - Botón flotante de rastreo
 * Todo el estado vive aquí — el Server Component no pasa funciones.
 */
export default function HomeClientActions() {
  const [modalOpen, setModalOpen] = useState(false);
  const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);
  const [becomeCreatorOpen, setBecomeCreatorOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

        if (userDb?.role && mounted) {
          const r = userDb.role.toLowerCase();
          if (r === "admin") setIsAdmin(true);
        }
      } else if (mounted) {
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
      {/* Botón flotante rastrear pedido */}
      <Link
        href="/envios"
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] h-14 inline-flex items-center bg-gradient-to-r from-[#00a19a] to-[#007973] hover:from-[#008f89] hover:to-[#00605c] text-white rounded-full px-6 md:px-8 font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(0,161,154,0.4)] hover:shadow-[0_15px_40px_rgba(0,161,154,0.6)] hover:-translate-y-1 transition-all active:scale-95 text-xs border border-teal-400/30 gap-2"
      >
        <FiPackage className="w-4 h-4" />
        <span className="hidden sm:inline">Rastrear tu Pedido</span>
        <span className="sm:hidden">Rastrear</span>
      </Link>

      <ContactModal open={modalOpen} onOpenChangeAction={setModalOpen} />

      {/* Modal Become Creator */}
      <BecomeCreatorModal
        open={becomeCreatorOpen}
        onOpenChange={setBecomeCreatorOpen}
      />

      {/* Botón y modal admin */}
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
