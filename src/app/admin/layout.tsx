"use client";
import AdminSidebar from "./topbaradmin";
import React, { Suspense, useState, useEffect } from "react";
import Loader from "~/components/providers/UiProvider";
import clsx from "clsx";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_sidebar_pinned");
      if (stored === "true") {
        setIsPinned(true);
      }
    }

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isPinned: boolean }>;
      setIsPinned(Boolean(customEvent.detail?.isPinned));
    };

    window.addEventListener("admin-sidebar-pinned-toggle", handleToggle);
    return () => window.removeEventListener("admin-sidebar-pinned-toggle", handleToggle);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 w-full">
      {/* Sidebar fijo con animación hover-expand y opción de anclar */}
      <AdminSidebar />

      {/*
        El main ocupa el espacio restante.
        Cuando la barra está desanclada (modo dinámico con animación hover-expand),
        lg:ml-20 deja al descubierto todo el contenido (Business Intelligence, etc.) sin taparlo.
        Si el usuario decide anclarla abierta, lg:ml-64 desplaza el contenido fluidamente.
      */}
      <main className={clsx(
        "flex-1 min-w-0 flex flex-col min-h-screen pt-16 lg:pt-0 relative overflow-x-hidden transition-all duration-300 ease-in-out",
        isPinned ? "lg:ml-64" : "lg:ml-20"
      )}>
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

