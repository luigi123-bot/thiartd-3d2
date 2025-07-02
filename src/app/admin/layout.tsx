"use client";
import AdminSidebar from "./AdminSidebar";
import React, { Suspense, useEffect, useState } from "react";
import Loader from "~/components/providers/UiProvider";
import { UserButton, useUser } from "@clerk/nextjs";
import { FiBell, FiMessageCircle } from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "TU_SUPABASE_URL";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "TU_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

function Notificaciones() {
  const [bajoStock, setBajoStock] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await supabase.from("productos").select("id,stock").lte("stock", 5).gt("stock", 0);
        setBajoStock(data?.length ?? 0);
      } catch (error) {
        console.error("Error fetching bajo stock data:", error);
      }
    })();
  }, []);

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-gray-200"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
      >
        <FiBell className="text-xl" />
        {bajoStock > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {bajoStock}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg p-4 z-50">
          <div className="font-semibold mb-2">Notificaciones</div>
          {bajoStock > 0 ? (
            <div className="text-sm text-red-600">
              Hay {bajoStock} producto(s) con stock bajo.
            </div>
          ) : (
            <div className="text-sm text-gray-500">Sin notificaciones.</div>
          )}
        </div>
      )}
    </div>
  );
}

interface MensajePendiente {
  id: number;
  conversacion_id: number;
  texto: string;
  created_at: string;
}

function NotificacionesMensajes() {
  const [pendientes, setPendientes] = useState<MensajePendiente[]>([]);
  const [open, setOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();

  // Cargar mensajes pendientes y suscripción realtime
  useEffect(() => {
    let isMounted = true;
    async function fetchPendientes() {
      const { data } = await supabase
        .from("mensajes")
        .select("id, conversacion_id, texto, created_at")
        .eq("leido_admin", false)
        .eq("remitente", "cliente")
        .order("created_at", { ascending: false });
      if (isMounted) setPendientes(data ?? []);
    }
    void fetchPendientes();

    // Suscripción realtime
    const channel = supabase
      .channel("mensajes-noti")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes", filter: "leido_admin=eq.false,remitente=eq.cliente" },
        () => {
          void fetchPendientes();
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3500);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mensajes", filter: "leido_admin=eq.true" },
        () => {
          void fetchPendientes();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  // Marcar como leídos todos los mensajes pendientes al abrir el panel
  useEffect(() => {
    if (open && pendientes.length > 0) {
      const ids = pendientes.map((m) => m.id);
      supabase
        .from("mensajes")
        .update({ leido_admin: true })
        .in("id", ids);
    }
  }, [open, pendientes]);

  // Ir al chat y marcar como leído solo ese mensaje
  const handleGoToChat = async (conversacion_id: number, mensaje_id: number) => {
    await supabase
      .from("mensajes")
      .update({ leido_admin: true })
      .eq("id", mensaje_id);
    setOpen(false);
    router.push(`/admin/mensajes?conv=${conversacion_id}`);
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-gray-200"
        onClick={() => setOpen((v) => !v)}
        aria-label="Mensajes"
      >
        <FiMessageCircle className="text-xl" />
        {pendientes.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full px-2 animate-bounce border-2 border-white shadow">
            {pendientes.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg p-4 z-50">
          <div className="font-semibold mb-2">Mensajes nuevos</div>
          {pendientes.length > 0 ? (
            <ul className="divide-y">
              {pendientes.map((m) => (
                <li key={m.id} className="py-2 flex items-center gap-2">
                  <button
                    className="flex-1 text-left text-sm hover:underline"
                    onClick={() => handleGoToChat(m.conversacion_id, m.id)}
                  >
                    <span className="font-semibold text-green-700">Nuevo mensaje:</span>{" "}
                    {m.texto.length > 40 ? m.texto.slice(0, 40) + "..." : m.texto}
                  </button>
                  <span className="text-xs text-gray-400">
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">Sin mensajes nuevos.</div>
          )}
          <a
            href="/admin/mensajes"
            className="block mt-3 text-blue-600 hover:underline text-sm"
          >
            Ir a mensajes
          </a>
        </div>
      )}
      {/* Toast tipo WhatsApp */}
      {showToast && pendientes.length > 0 && (
        <div className="fixed bottom-8 right-8 z-[9999] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <FiMessageCircle className="text-xl" />
          <span>
            {pendientes.length === 1
              ? "Nuevo mensaje recibido"
              : `Tienes ${pendientes.length} mensajes nuevos`}
          </span>
          <a
            href="/admin/mensajes"
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Guardar el rol en Clerk si no existe (solo ejemplo, ajusta según tu lógica real)
  useEffect(() => {
    if (isLoaded && user && !user.publicMetadata?.role) {
      void user.update({ unsafeMetadata: { ...user.unsafeMetadata, role: "user" } });
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role !== "admin") {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return <Loader />;
  }

  if (user?.publicMetadata?.role !== "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1">
        <div className="flex justify-end items-center gap-4 p-4 border-b bg-white">
          <NotificacionesMensajes />
          <Notificaciones />
          <UserButton afterSignOutUrl="/" />
        </div>
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
