import React from "react";
import TopbarTienda from "./componentes/TopbarTienda";
import Footer from "~/components/Footer";
import ClientChatWidgetWrapper from "~/components/ClientChatWidgetWrapper";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopbarTienda />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ClientChatWidgetWrapper />
    </div>
  );
}
