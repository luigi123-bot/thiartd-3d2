"use client";
import { useUser } from "@clerk/nextjs";
import ChatWidget from "./ChatWidget";

export default function ClientChatWidgetWrapper() {
  const { user } = useUser();
  const clienteId = user?.id ?? "anon";
  const clienteNombre =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username ?? user?.emailAddresses?.[0]?.emailAddress ?? "Invitado";
  const clienteEmail = user?.emailAddresses?.[0]?.emailAddress ?? "sin-email@thiart3d.com";

  return (
    <ChatWidget
      clienteId={clienteId}
      clienteNombre={clienteNombre}
      clienteEmail={clienteEmail}
    />
  );
}
