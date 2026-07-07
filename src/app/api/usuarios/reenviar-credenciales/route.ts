import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "../../../../lib/email-service";

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

interface UsuarioDB {
  id: string;
  nombre: string;
  email: string;
  role: string;
  auth_id?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { id: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "El ID de usuario es obligatorio" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Buscar el usuario en la base de datos
    const { data: usuario, error: fetchError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .single<UsuarioDB>();

    if (fetchError || !usuario) {
      console.error("Error buscando usuario:", fetchError?.message);
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 2. Generar contraseña temporal
    const tempPassword = `Temp-${Math.random().toString(36).substring(2, 10)}!`;

    // 3. Si tiene auth_id, actualizar la contraseña en Supabase Auth
    if (usuario.auth_id && supabaseServiceKey) {
      console.log(`Actualizando contraseña en Supabase Auth para: ${usuario.email}`);
      const { error: authError } = await supabase.auth.admin.updateUserById(usuario.auth_id, {
        password: tempPassword,
      });

      if (authError) {
        console.error("Error actualizando contraseña en Supabase Auth:", authError.message);
        return NextResponse.json({ error: `Error en Auth: ${authError.message}` }, { status: 500 });
      }
    } else {
      console.warn("No se pudo actualizar la contraseña en Auth (falta auth_id o service_role key)");
    }

    // 4. Enviar correo con las nuevas credenciales
    console.log(`Enviando credenciales por correo a: ${usuario.email}`);
    const emailResult = await sendWelcomeEmail({
      to: usuario.email,
      nombre: usuario.nombre,
      password: tempPassword,
      role: usuario.role,
      roleLabel: usuario.role,
    });

    if (!emailResult.success) {
      console.error("Error enviando correo:", emailResult.error);
      return NextResponse.json({ error: "Error enviando correo: " + String(emailResult.error) }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Credenciales reenviadas exitosamente" });

  } catch (err) {
    console.error("Error en reenviar-credenciales:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
