import type { NextApiRequest, NextApiResponse } from "next";
import clerk from "@clerk/clerk-sdk-node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Trae todos los usuarios de Clerk (paginación opcional)
    const users = await clerk.users.getUserList({ limit: 100 });

    type ClerkUser = {
      id: string;
      firstName: string | null;
      lastName: string | null;
      emailAddresses: Array<{ emailAddress: string }>;
      createdAt: number;
    };

    // Sincroniza todos los usuarios de Clerk en Supabase en un solo upsert
    const usuariosSupabase = users
      .map((u: ClerkUser) => {
        const nombre = [u.firstName, u.lastName].filter(Boolean).join(" ");
        const email = u.emailAddresses?.[0]?.emailAddress ?? "";
        if (!u.id || !email || !nombre) return null;
        return {
          clerk_id: u.id,
          email,
          nombre,
          creado_en: new Date(u.createdAt).toISOString(),
        };
      })
      .filter(Boolean);

    if (usuariosSupabase.length > 0) {
      // Upsert masivo, usando clerk_id como clave única
      await supabase
        .from("usuarios")
        .upsert(usuariosSupabase, { onConflict: "clerk_id" });
    }

    res.status(200).json({
      usuarios: users.map((u: ClerkUser) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        emailAddresses: u.emailAddresses,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error al obtener usuarios de Clerk" });
    }
  }
}

// Ejemplo de login con verificación de email
export async function loginUsuario(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Si el error es de email no confirmado
    if (error.message?.toLowerCase().includes("email not confirmed") || error.message?.toLowerCase().includes("correo no confirmado")) {
      return { error: "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada." };
    }
    return { error: error.message };
  }
  // Si el usuario está logueado pero no confirmado
  if (data?.user && !data.user.confirmed_at) {
    return { error: "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada." };
  }
  return { user: data.user };
}
