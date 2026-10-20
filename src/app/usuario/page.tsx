'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SupabaseAuth from "~/components/SupabaseAuth";
import { Button } from "~/components/ui/button";
import { supabase } from "~/lib/supabaseClient";
import Link from "next/link";
import { User, ShoppingBag, Loader2 } from "lucide-react";

export default function UsuarioPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.replace("/tienda/mi-perfil");
      } else {
        setChecking(false);
      }
    }
    void checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00a19a] animate-spin mb-3" />
        <p className="text-sm text-slate-500">Comprobando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-teal-50 text-[#00a19a] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Portal de Usuario</h1>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Accede a tu cuenta para administrar tus pedidos, direcciones de entrega y datos personales.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => setShowAuth(true)}
            className="w-full bg-[#00a19a] hover:bg-[#008f89] text-white font-bold h-12 rounded-xl text-sm uppercase tracking-wider shadow-sm"
          >
            Iniciar Sesión / Registrarse
          </Button>

          <Link href="/tienda/productos" className="block">
            <Button
              variant="outline"
              className="w-full rounded-xl h-11 border-slate-200 text-slate-700 font-bold text-xs"
            >
              <ShoppingBag className="w-4 h-4 mr-2" /> Explorar la Tienda
            </Button>
          </Link>
        </div>
      </div>

      <SupabaseAuth 
        open={showAuth} 
        onOpenChange={setShowAuth}
        onAuth={() => {
          router.replace("/tienda/mi-perfil");
        }}
      />
    </div>
  );
}