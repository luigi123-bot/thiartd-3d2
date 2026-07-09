"use client";
import ChatWidget from "./ChatWidget";
import { useEffect, useState } from "react";
import { supabase } from "~/lib/supabaseClient";

export default function ClientChatWidgetWrapper() {
  const [guestId, setGuestId] = useState<string>("");
  const [clienteNombre, setClienteNombre] = useState("Invitado");
  const [clienteEmail, setClienteEmail] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Generar / recuperar guest ID
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("guest_chat_id");
      if (!id || id.startsWith("guest_") || id.length !== 36) {
        id = crypto.randomUUID();
        localStorage.setItem("guest_chat_id", id);
      }
      setGuestId(id);
    }

    // Obtener usuario autenticado de Supabase
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const meta = data.user.user_metadata as { nombre?: string; full_name?: string } | undefined;
        setClienteNombre(meta?.nombre ?? meta?.full_name ?? data.user.email ?? "Cliente");
        setClienteEmail(data.user.email ?? "");
      }
      setLoaded(true);
    };

    void getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata as { nombre?: string; full_name?: string } | undefined;
        setClienteNombre(meta?.nombre ?? meta?.full_name ?? session.user.email ?? "Cliente");
        setClienteEmail(session.user.email ?? "");
      } else {
        setClienteNombre("Invitado");
        setClienteEmail("");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!loaded && !guestId) return null;

  const emailFinal = clienteEmail || `invitado-${guestId.slice(0, 8)}@thiart3d.com`;

  return (
    <ChatWidget
      clienteNombre={clienteNombre}
      clienteEmail={emailFinal}
    />
  );
}
