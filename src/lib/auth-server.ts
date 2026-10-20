import { NextResponse } from "next/server";
import { getSupabaseServer } from "~/lib/supabaseServer";
import type { User } from "@supabase/supabase-js";

export interface AdminAuthResult {
  authorized: boolean;
  user?: User;
  role?: string;
  errorResponse?: NextResponse;
}

/**
 * Extrae el token JWT desde:
 * 1. Header `Authorization: Bearer <token>`
 * 2. Cookie `sb-access-token=<token>`
 */
export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/sb-access-token=([^;]+)/);
  if (match?.[1]) {
    return decodeURIComponent(match[1].trim());
  }

  return null;
}

/**
 * Valida que la petición incluya una sesión válida de Supabase
 * y que el usuario tenga el rol 'admin' en la tabla 'usuarios'.
 */
export async function verifyAdminSession(req: Request): Promise<AdminAuthResult> {
  const token = extractAuthToken(req);

  if (!token) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "No autorizado: se requiere sesión de administrador." },
        { status: 401 }
      ),
    };
  }

  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { error: "Sesión inválida o expirada." },
          { status: 401 }
        ),
      };
    }

    // Consultar el rol en la base de datos
    const { data: usuarioDb, error: dbError } = await supabase
      .from("usuarios")
      .select("id, role, email")
      .or(`id.eq.${user.id},auth_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle() as { data: { id: string; role?: string; email?: string } | null; error: unknown };

    if (dbError || !usuarioDb) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { error: "Usuario no registrado en el sistema." },
          { status: 403 }
        ),
      };
    }

    const role = (usuarioDb.role ?? "").toLowerCase();
    if (role !== "admin") {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { error: "Acceso denegado: se requieren permisos de administrador." },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      user,
      role,
    };
  } catch (err) {
    console.error("Error al validar sesión de administrador:", err);
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Error interno al verificar permisos de acceso." },
        { status: 500 }
      ),
    };
  }
}
