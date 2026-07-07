"use client";
import AdminSidebar from "./topbaradmin";
import React, { Suspense } from "react";
import Loader from "~/components/providers/UiProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 w-full">
      <AdminSidebar />
      <main className="flex-1 min-w-0 flex flex-col min-h-screen pt-16 lg:pt-0 relative overflow-x-hidden">
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
