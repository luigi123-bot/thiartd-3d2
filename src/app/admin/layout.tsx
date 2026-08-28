"use client";
import AdminSidebar from "./topbaradmin";
import React, { Suspense } from "react";
import Loader from "~/components/providers/UiProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 w-full">
      {/* Sidebar fijo — no se mueve con el scroll */}
      <AdminSidebar />

      {/*
        El main ocupa el espacio restante.
        lg:ml-20 coincide con el sidebar colapsado (w-20 = 80px).
        El sidebar al expandirse hace hover-expand pero sigue siendo w-20 en base,
        así que el margen base es siempre 80px en desktop.
      */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen pt-16 lg:pt-0 lg:ml-20 relative overflow-x-hidden">
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
