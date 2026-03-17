import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "../../../lib/email-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente con service_role y config de servidor (sin persistencia de sesión)
const getAdminClient = () => {
  const key = supabaseServiceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { nombre: string; email: string; password: string; role?: string; role_label?: string };
    const { nombre, email, password, role, role_label } = body;

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Nombre, email y password son obligatorios" }, { status: 400 });
    }

    if (!supabaseServiceKey) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY no configurada — auth.admin no disponible.");
    }

    const supabase = getAdminClient();
    // Normalize role: use role_label if provided (slug), otherwise fallback to role id/string
    const desiredRole = (role_label ?? role ?? "cliente").toString().toLowerCase();

    // 1. Crear usuario en Supabase Auth (requiere service_role key)
    let authUserId: string | undefined;
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre },
      });

      if (authError) {
        console.warn("auth.admin.createUser error:", authError.message);
      } else if (authData?.user?.id) {
        authUserId = authData.user.id;
        console.log("✅ Usuario creado en Auth:", authUserId);
      }
    } catch (err) {
      console.warn("Error llamando auth.admin.createUser:", err);
    }

    // 2. Insertar en tabla usuarios
    const insertBody: { nombre: string; email: string; role: string; auth_id?: string } = {
      nombre,
      email,
      role: desiredRole,
    };
    if (authUserId) insertBody.auth_id = authUserId;

    interface Usuario {
      id: string;
      nombre: string;
      email: string;
      role: string;
      auth_id?: string;
      creado_en?: string;
    }

    const { data: insertData, error: insertError } = await supabase
      .from("usuarios")
      .insert([insertBody])
      .select()
      .single<Usuario>();

    if (insertError) {
      console.error("Error insertando usuario:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 3. Enviar correo de bienvenida con las credenciales
    try {
      const emailResult = await sendWelcomeEmail({ 
        to: email, 
        nombre, 
        password, 
        role: desiredRole,
        roleLabel: role_label
      });
      if (!emailResult.success) {
        console.warn("No se pudo enviar correo de bienvenida:", emailResult.error);
      } else {
        console.log("✅ Correo de bienvenida enviado a:", email);
      }
    } catch (emailErr) {
      console.warn("Error enviando correo de bienvenida:", emailErr);
    }

    return NextResponse.json({ user: insertData, emailSent: true });

  } catch (err) {
    console.error("Error en /api/crear-usuario:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

