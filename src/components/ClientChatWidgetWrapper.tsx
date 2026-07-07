"use client";
import ChatWidget from "./ChatWidget";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function ClientChatWidgetWrapper() {
  const { user, isLoaded } = useUser();
  const [guestId, setGuestId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("guest_chat_id");
      if (!id || id.startsWith("guest_") || id.length !== 36) {
        id = crypto.randomUUID();
        localStorage.setItem("guest_chat_id", id);
      }
      setGuestId(id);
    }
  }, []);

  if (!isLoaded || (!user && !guestId)) return null;

  const clienteNombre = user?.fullName ?? user?.firstName ?? "Invitado";
  const clienteEmail = user?.primaryEmailAddress?.emailAddress 
    ?? `invitado-${guestId.slice(0, 8)}@thiart3d.com`;

  return (
    <ChatWidget
      clienteNombre={clienteNombre}
      clienteEmail={clienteEmail}
    />
  );
}
