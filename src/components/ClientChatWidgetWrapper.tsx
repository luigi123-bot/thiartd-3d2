"use client";
import ChatWidget from "./ChatWidget";

// Recibe datos del usuario por props o contexto propio
export default function ClientChatWidgetWrapper({
  usuario,
}: {
  usuario?: { id?: string; nombre?: string; email?: string };
}) {
  const clienteId = usuario?.id ?? "anon";
  const clienteNombre = usuario?.nombre ?? "Invitado";
  const clienteEmail = usuario?.email ?? "sin-email@thiart3d.com";

  return (
    <ChatWidget
      clienteId={clienteId}
      clienteNombre={clienteNombre}
      clienteEmail={clienteEmail}
    />
  );
}
