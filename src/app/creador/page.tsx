"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "~/lib/supabaseClient";
import CreatorDashboard from "~/components/CreatorDashboard";
import { Button } from "~/components/ui/button";
import { AlertCircle } from "lucide-react";
import TopbarCreador from "~/components/TopbarCreador";

interface UsuarioDB {
  id: string;
  nombre: string;
  email: string;
  role: string;
}

export default function CreadorPage() {
  const router = useRouter();
  const [creatorUser, setCreatorUser] = useState<UsuarioDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const [activeView, setActiveView] = useState<"stats" | "chat">("stats");
  const [forceOpenModal, setForceOpenModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (mounted) setErrorStatus("Error de sesión: " + sessionError.message);
          return;
        }

        if (!session) {
          if (mounted) router.push("/");
          return;
        }

        const { data: userData, error: dbError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", session.user.id)
          .single() as { data: UsuarioDB | null; error: { message: string } | null };

        if (dbError ?? !userData) {
          if (mounted) setErrorStatus("No se pudieron cargar los datos del usuario creador.");
          return;
        }

        if (userData.role !== "creador" && userData.role !== "admin") {
          if (mounted) router.push("/");
          return;
        }

        if (mounted) {
          setCreatorUser(userData);
          setErrorStatus(null);
        }
      } catch {
        if (mounted) setErrorStatus("Error crítico al cargar el panel.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void checkUser();
    return () => { mounted = false; };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#009688]/20 border-t-[#009688] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-8 h-8 bg-[#009688]/10 rounded-full"></div>
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 tracking-tight">Cargando Panel Maestro</p>
            <p className="text-sm text-gray-400 mt-2 font-medium">Verificando credenciales de creador verificado...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
             <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 tracking-tight">Algo salió mal</p>
            <p className="text-sm text-gray-500 mt-2 font-medium">{errorStatus}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 h-12 font-bold shadow-lg">
            Reintentar acceso
          </Button>
          <Button variant="ghost" onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">
            Volver a la tienda
          </Button>
        </div>
      </div>
    );
  }

  if (!creatorUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopbarCreador 
        user={creatorUser} 
        onViewChange={(v) => setActiveView(v as "stats" | "chat")}
        onOpenAddProduct={() => setForceOpenModal(true)}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
          <div className="bg-[#0f172a] p-8 md:p-12 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-[#009688]/15 rounded-full blur-[100px] -mr-48 -mt-48 transition-opacity duration-1000"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black mb-3 tracking-tight leading-none uppercase">Hola, {creatorUser.nombre.split(' ')[0]} 👋</h2>
                  <p className="text-slate-400 text-base max-w-lg font-medium leading-relaxed mt-4">
                    Gestiona tu inventario, analiza las métricas de tus ventas y mantén el contacto con tus clientes de forma directa.
                  </p>
                </div>
                <div className="flex gap-2">
                   <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2 leading-none">Tu Perfil</div>
                      <div className="text-md font-black text-[#009688]">ARTISTA VERIFICADO</div>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="p-4 md:p-12 bg-gray-50/10">
             <CreatorDashboard 
                user={creatorUser} 
                externalView={activeView} 
                onViewChange={setActiveView}
                forceOpenModal={forceOpenModal}
                onModalHandled={() => setForceOpenModal(false)}
             />
          </div>
        </div>
      </main>

      <footer className="py-12 text-center">
         <p className="text-gray-200 text-[11px] font-black uppercase tracking-[0.5em] transition-opacity hover:opacity-100 opacity-50">
            &copy; {new Date().getFullYear()} Thiart 3D Studio &bull; Centro de Control
         </p>
      </footer>
    </div>
  );
}
