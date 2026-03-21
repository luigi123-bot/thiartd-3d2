"use client";
import AdminSidebar from "./topbaradmin";
import React, { Suspense } from "react";
import Loader from "~/components/providers/UiProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 w-full">
      <AdminSidebar />
      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden flex flex-col">
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
