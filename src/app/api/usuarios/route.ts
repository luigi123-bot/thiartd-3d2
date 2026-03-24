import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";

// Variables de entorno para Supabase y Clerk
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

/**
 * Endpoint de API para la gestión de usuarios.
 * Soporta operaciones de obtención (GET), creación (POST), eliminación (DELETE) y actualización (PATCH).
 * Integra tanto Supabase Auth como webhooks de Clerk.
 */

/**
 * GET: Obtener la lista de usuarios.
 * Intenta usar el JWT de Clerk si está presente en el header Authorization para actuar en nombre del usuario.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  let supabase = createClient(supabaseUrl, supabaseKey);

  if (authHeader?.startsWith("Bearer ")) {
    const jwt = authHeader.replace("Bearer ", "");
    supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    });
  }

  const { data: usuarios, error } = await supabase.from("usuarios").select("*");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ usuarios });
}

/**
 * POST: Crea o actualiza usuarios.
 * Posee dos modos:
 * 1. Webhook de Clerk: Sincroniza usuarios creados en Clerk hacia la tabla 'usuarios' de Supabase.
 * 2. Creación manual: Crea un usuario en Supabase Auth y luego lo registra en la tabla 'usuarios'.
 */
export async function POST(req: Request) {
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verificamos si la petición viene de un Webhook de Clerk (identificado por los headers de svix)
  if (svix_id && svix_timestamp && svix_signature && CLERK_WEBHOOK_SECRET) {
    const payload = await req.text();
    try {
      const wh = new Webhook(CLERK_WEBHOOK_SECRET);
      // Validamos la firma del webhook para asegurar que viene de Clerk
      const evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as { data: { id: string, email_addresses: { email_address: string }[], first_name?: string, last_name?: string } };
      
      const { id, email_addresses, first_name, last_name } = evt.data;
      const clerk_id = id;
      const email = email_addresses?.[0]?.email_address;
      const nombre = (first_name && last_name) ? `${first_name} ${last_name}` : "";
      
      if (!clerk_id || !email || !nombre) {
        return NextResponse.json(
          { error: "Faltan datos obligatorios del webhook." },
          { status: 400 }
        );
      }
      
      // Sincronizamos con la tabla usuarios usando upsert (crear o actualizar)
      const { data, error } = await supabase
        .from("usuarios")
        .upsert([{ clerk_id, email, nombre }], { onConflict: "clerk_id" })
        .select()
        .single();
        
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ usuario: data });
    } catch (err) {
      console.error("Error validando Webhook de Clerk:", err);
      return NextResponse.json({ error: "Petición no autorizada" }, { status: 401 });
    }
  } else {
    // Escenario de creación manual desde el panel de administración
    type UsuarioBody = { nombre: string; email: string; password: string };
    let body: UsuarioBody;
    try {
      body = await req.json() as UsuarioBody;
    } catch {
      return NextResponse.json({ error: "Cuerpo de petición inválido" }, { status: 400 });
    }
    
    const { nombre, email, password } = body;
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son obligatorios." },
        { status: 400 }
      );
    }
    
    // 1. Crear el usuario en la sección de Autenticación de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Error en Supabase Auth: " + authError?.message }, { status: 500 });
    }
    
    const auth_id = authData.user.id;
    
    // 2. Registrar el usuario en nuestra tabla personalizada 'usuarios' para manejar perfiles y roles
    const { data: usuarioData, error: dbError } = await supabase
      .from("usuarios")
      .insert([{ nombre, email, password, auth_id }])
      .select()
      .single();
      
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      usuario: usuarioData,
      message: "Usuario creado exitosamente. Se requiere confirmación de correo."
    });
  }
}

/**
 * DELETE: Elimina un usuario de forma completa.
 * Utiliza la Service Role Key para poder borrar tanto el registro en la base de datos
 * como la identidad en Supabase Auth (admin delete).
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Falta Service Role Key" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener el auth_id antes de borrar el registro
    const { data: user } = await supabaseAdmin
      .from("usuarios")
      .select("auth_id")
      .eq("id", id)
      .single();

    // 2. Si existe en Supabase Auth, borrarlo del sistema de autenticación
    if (user?.auth_id) {
      await supabaseAdmin.auth.admin.deleteUser(user.auth_id);
    }

    // 3. Borrar el registro de la tabla de perfiles
    const { error: deleteErr } = await supabaseAdmin
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en DELETE usuario:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * PATCH: Actualiza el rol de un usuario.
 * Permite cambiar permisos (admin, creador, cliente) desde el panel administrativo.
 */
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json() as { id?: string; role?: string; rol?: string };
    const userId = id ?? body.id;
    const newRole = body.role ?? body.rol; // Soporte para ambos nombres de campo

    if (!userId || !newRole) {
      return NextResponse.json({ error: "ID y Rol obligatorios" }, { status: 400 });
    }

    if (!supabaseServiceKey) return NextResponse.json({ error: "Falta Service Role Key" }, { status: 500 });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Actualizamos el rol técnico en la tabla de usuarios
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .update({ role: newRole })
      .eq("id", userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, usuario: data });
  } catch (err) {
    console.error("Error en PATCH usuario:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
