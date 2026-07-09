"use client";
import { useEffect } from "react";
import { supabase } from "~/lib/supabaseClient";

// Componente vacío — Clerk eliminado. Auth manejado por Supabase.
export default function SyncUser() {
  useEffect(() => {
    // Sin Clerk: el sync de usuario lo maneja SupabaseAuth directamente
    void supabase.auth.getSession();
  }, []);

  return null;
}
