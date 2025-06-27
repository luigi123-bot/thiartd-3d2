"use client";
import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function NotificacionesUsuario() {
  const { user } = useUser();
  const router = useRouter();
  const [notis, setNotis] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Cargar notificaciones y suscripción realtime
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    async function fetchNotis() {
      if (!user) return;
      const { data } = await supabase
        .from("notificaciones")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("leido", false)
        .order("created_at", { ascending: false });
      if (isMounted) setNotis(data || []);
    }
    fetchNotis();

    // Suscripción realtime
    const channel = supabase
      .channel("notificaciones-usuario")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones", filter: `usuario_id=eq.${user?.id}` },
        (payload) => {
          fetchNotis();
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3500);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notificaciones", filter: `usuario_id=eq.${user?.id}` },
        () => {
          fetchNotis();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Marcar como leídas al abrir el panel
  useEffect(() => {
    if (open && notis.length > 0) {
      const ids = notis.map((n) => n.id);
      supabase.from("notificaciones").update({ leido: true }).in("id", ids);
    }
  }, [open, notis]);

  // Ir a detalle según tipo de notificación
  const handleGoTo = (noti: any) => {
    setOpen(false);
    if (noti.pedido_id) router.push(`/usuario/pedidos/${noti.pedido_id}`);
    else if (noti.conversacion_id) router.push(`/usuario/chat?conv=${noti.conversacion_id}`);
    else if (noti.producto_id) router.push(`/tienda/productos/${noti.producto_id}`);
    else router.push("/usuario/notificaciones");
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-gray-200"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
      >
        <FiBell className="text-xl" />
        {notis.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full px-2 animate-bounce border-2 border-white shadow">
            {notis.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg p-4 z-50">
          <div className="font-semibold mb-2">Tus notificaciones</div>
          {notis.length > 0 ? (
            <ul className="divide-y">
              {notis.map((n) => (
                <li key={n.id} className="py-2 flex items-center gap-2">
                  <button
                    className="flex-1 text-left text-sm hover:underline"
                    onClick={() => handleGoTo(n)}
                  >
                    <span className="font-semibold text-green-700">{n.tipo === "pedido" ? "Pedido" : n.tipo === "mensaje" ? "Mensaje" : "Notificación"}:</span>{" "}
                    {n.mensaje?.length > 40 ? n.mensaje.slice(0, 40) + "..." : n.mensaje}
                  </button>
                  <span className="text-xs text-gray-400">
                    {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">Sin notificaciones nuevas.</div>
          )}
          <a
            href="/usuario/notificaciones"
            className="block mt-3 text-blue-600 hover:underline text-sm"
          >
            Ver todas
          </a>
        </div>
      )}
      {/* Toast tipo WhatsApp */}
      {showToast && notis.length > 0 && (
        <div className="fixed bottom-8 right-8 z-[9999] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <FiBell className="text-xl" />
          <span>
            {notis.length === 1
              ? "Tienes una nueva notificación"
              : `Tienes ${notis.length} notificaciones nuevas`}
          </span>
          <a
            href="/usuario/notificaciones"
            className="ml-2 underline text-white font-semibold"
          >
            Ver
          </a>
        </div>
      )}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in {
          animation: fade-in 0.5s;
        }
      `}</style>
    </div>
  );
}
