"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "~/lib/supabaseClient";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleAuth() {
      try {
        // 1. Verificar posibles errores en la URL (hash o query params)
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));

          const error = urlParams.get("error") || hashParams.get("error");
          const errorDescription =
            urlParams.get("error_description") || hashParams.get("error_description");

          if (error || errorDescription) {
            if (mounted) {
              setErrorMsg(errorDescription || error || "Error de autenticación con el proveedor");
            }
            return;
          }

          // 2. Si viene con flujo PKCE (?code=...)
          const code = urlParams.get("code");
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error("Error intercambiando código PKCE:", exchangeError);
              if (mounted) setErrorMsg(exchangeError.message);
              return;
            }
          }
        }

        // 3. Obtener la sesión activa (Supabase procesa automáticamente el hash fragment en el cliente)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (mounted) setErrorMsg(sessionError.message);
          return;
        }

        if (session?.user) {
          const user = session.user;

          // Sincronizar cookie 'sb-access-token'
          if (session.access_token && typeof document !== "undefined") {
            document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          }

          // Asegurar que el usuario exista en la tabla 'usuarios'
          const { data: usuarioExistente } = await supabase
            .from("usuarios")
            .select("id, role")
            .or(`id.eq.${user.id},auth_id.eq.${user.id},email.eq.${user.email}`)
            .maybeSingle() as { data: { id: string; role?: string } | null };

          if (!usuarioExistente) {
            const fullName =
              (user.user_metadata?.full_name as string | undefined) ??
              (user.user_metadata?.nombre as string | undefined) ??
              (user.user_metadata?.name as string | undefined) ??
              user.email?.split("@")[0] ??
              "Usuario Google";

            await supabase.from("usuarios").upsert(
              {
                id: user.id,
                auth_id: user.id,
                email: user.email,
                nombre: fullName,
                role: "cliente",
                creado_en: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
          }

          const role = (usuarioExistente?.role ?? "cliente").toLowerCase();

          // Redirección según rol
          if (role === "admin") {
            router.replace("/admin");
          } else if (role === "creador") {
            router.replace("/creador");
          } else {
            router.replace("/tienda/mi-perfil");
          }
          return;
        }

        // 4. Si aún no termina de hidratar, escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (event === "SIGNED_IN" && currentSession?.user) {
            if (currentSession.access_token && typeof document !== "undefined") {
              document.cookie = `sb-access-token=${currentSession.access_token}; path=/; max-age=604800; SameSite=Lax`;
            }
            router.replace("/tienda/mi-perfil");
          }
        });

        // Timeout de seguridad
        const timer = setTimeout(() => {
          if (mounted && !session) {
            router.replace("/");
          }
        }, 4000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err) {
        console.error("Error en AuthCallbackContent:", err);
        if (mounted) setErrorMsg("Ocurrió un error inesperado al procesar la sesión.");
      }
    }

    void handleAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            ✕
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Error de autenticación</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => router.replace("/")}
            className="w-full bg-[#00a19a] hover:bg-[#008f89] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Loader2 className="w-10 h-10 text-[#00a19a] animate-spin mb-4" />
      <p className="text-slate-600 font-medium text-sm">Completando inicio de sesión...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <Loader2 className="w-10 h-10 text-[#00a19a] animate-spin mb-4" />
          <p className="text-slate-600 font-medium text-sm">Cargando...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
