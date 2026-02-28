import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "~/lib/email-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variable");
}

// Cliente de Supabase con permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Clave secreta para JWT (DEBE estar en .env)
const JWT_SECRET = process.env.JWT_SECRET ?? "tu_clave_secreta_muy_segura_cambiala_en_produccion";

// Generar código de 6 dígitos
function generarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generar token JWT con el código y email
function generarTokenReset(email: string, codigo: string): string {
  const payload = {
    email,
    codigo,
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // Expira en 15 minutos
  };
  return jwt.sign(payload, JWT_SECRET);
}

// Verificar y decodificar token JWT
function verificarTokenReset(token: string): { email: string; codigo: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; codigo: string };
    return decoded;
  } catch (error) {
    console.error("Error al verificar token:", error);
    return null;
  }
}

// POST: Enviar código de recuperación
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string;
      action?: string;
      code?: string;
      token?: string;
      newPassword?: string;
    };

    const { email, action, code, token, newPassword } = body;

    if (action === "send-code") {
      if (!email) {
        return NextResponse.json(
          { error: "Email es requerido" },
          { status: 400 }
        );
      }

      // Verificar que el usuario existe - Intentar en 'usuarios' y 'usuario'
      let targetUser: { id: string; email: string; nombre: string } | null = null;

      // 1. Intentar en 'usuarios'
      const { data: q1 } = await supabase
        .from("usuarios")
        .select("id, email, nombre")
        .ilike("email", email)
        .maybeSingle();

      if (q1) {
        targetUser = q1 as { id: string; email: string; nombre: string };
      }

      // 2. Intentar en 'usuario'
      if (!targetUser) {
        const { data: q2 } = await supabase
          .from("usuario")
          .select("id, email, nombre")
          .ilike("email", email)
          .maybeSingle();

        if (q2) {
          targetUser = q2 as { id: string; email: string; nombre: string };
        }
      }

      if (!targetUser) {
        return NextResponse.json(
          { error: "No se encontró una cuenta con este correo electrónico" },
          { status: 404 }
        );
      }

      // Generar código
      const codigo = generarCodigo();

      // Generar token JWT con el código (no guardamos en DB)
      const resetToken = generarTokenReset(email, codigo);

      // Enviar correo con Resend
      const emailResult = await sendPasswordResetEmail({
        to: email,
        code: codigo,
        userName: targetUser.nombre,
      });

      if (!emailResult.success) {
        console.error("Error al enviar correo:", emailResult.error);
        return NextResponse.json(
          { error: "Error al enviar el correo. Intenta nuevamente." },
          { status: 500 }
        );
      }

      // Registrar en notificaciones para auditoría
      await supabase.from("notificaciones").insert({
        usuario_id: targetUser.id,
        tipo: "email",
        titulo: "Código de recuperación de contraseña",
        mensaje: `Código de recuperación enviado a ${email}. Expira en 15 minutos.`,
        enviado: true,
        fecha_envio: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Código enviado exitosamente. Revisa tu correo.",
        token: resetToken, // Devolvemos el token para validación posterior
        // En desarrollo, devolvemos el código. En producción, ELIMINA esta línea:
        debug_codigo: process.env.NODE_ENV === "development" ? codigo : undefined,
      });
    }

    if (action === "verify-code") {
      if (!token || !code) {
        return NextResponse.json(
          { error: "Token y código son requeridos" },
          { status: 400 }
        );
      }

      // Verificar el token JWT
      const decoded = verificarTokenReset(token);

      if (!decoded) {
        return NextResponse.json(
          { error: "Token inválido o expirado" },
          { status: 400 }
        );
      }

      // Verificar que el código coincide
      if (decoded.codigo !== code) {
        return NextResponse.json(
          { error: "Código incorrecto" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Código verificado correctamente",
        email: decoded.email,
      });
    }

    if (action === "update-password") {
      if (!token || !code || !newPassword) {
        return NextResponse.json(
          { error: "Token, código y nueva contraseña son requeridos" },
          { status: 400 }
        );
      }

      // Verificar el token JWT nuevamente
      const decoded = verificarTokenReset(token);

      if (!decoded) {
        return NextResponse.json(
          { error: "Token inválido o expirado" },
          { status: 400 }
        );
      }

      // Verificar que el código coincide
      if (decoded.codigo !== code) {
        return NextResponse.json(
          { error: "Código incorrecto" },
          { status: 400 }
        );
      }

      // Obtener el usuario - Intentar en 'usuarios' y 'usuario' con búsqueda insensible a mayúsculas
      let authUserId: string | null = null;

      // 1. Intentar en 'usuarios'
      const { data: userPlural } = await supabase
        .from("usuarios")
        .select("id, auth_id")
        .ilike("email", decoded.email)
        .maybeSingle() as { data: { id: string; auth_id: string | null } | null };

      if (userPlural) {
        authUserId = userPlural.auth_id ?? userPlural.id;
        console.log("Usuario encontrado en 'usuarios' (update):", authUserId);
      }

      // 2. Si no se encontró, intentar en 'usuario'
      if (!authUserId) {
        const { data: userSingular } = await supabase
          .from("usuario")
          .select("id, auth_id")
          .ilike("email", decoded.email)
          .maybeSingle() as { data: { id: string; auth_id: string | null } | null };

        if (userSingular) {
          authUserId = userSingular.auth_id ?? userSingular.id;
          console.log("Usuario encontrado en 'usuario' (update):", authUserId);
        }
      }

      // 3. Fallback CRÍTICO: Buscar directamente en Auth de Supabase si no está en las tablas de perfil
      if (!authUserId) {
        console.log("Usuario no encontrado en tablas de perfil, buscando en Auth directamente...");
        const { data: authList, error: listError } = await supabase.auth.admin.listUsers();

        if (!listError && authList?.users) {
          const authFound = authList.users.find(u =>
            u.email?.toLowerCase() === decoded.email.toLowerCase()
          );
          if (authFound) {
            authUserId = authFound.id;
            console.log("Usuario encontrado directamente en Auth:", authUserId);
          }
        }
      }

      if (!authUserId) {
        console.error("No se encontró el usuario para actualización:", decoded.email);
        return NextResponse.json(
          { error: "No se pudo encontrar una cuenta de autenticación vinculada a este correo (" + decoded.email + ")" },
          { status: 404 }
        );
      }

      // Actualizar contraseña usando Supabase Admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUserId,
        { password: newPassword }
      );

      if (updateError) {
        console.error("Error al actualizar contraseña:", updateError);
        return NextResponse.json(
          { error: "Error al actualizar la contraseña" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Contraseña actualizada exitosamente",
      });
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
