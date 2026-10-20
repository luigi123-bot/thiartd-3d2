import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Middleware global de Next.js para control de acceso basado en roles (RBAC).
 * Protege las rutas de /admin, /creador y /api/admin verificando la sesión de Supabase y el rol en la base de datos.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Extraer token desde el header Authorization o la cookie 'sb-access-token'
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = authHeader || req.cookies.get('sb-access-token')?.value;

  const isApiAdmin = pathname.startsWith('/api/admin');
  const isAdminPage = pathname.startsWith('/admin');
  const isCreadorPage = pathname.startsWith('/creador');

  // Si no hay sesión (ni token en header ni en cookie)
  if (!token) {
    if (isApiAdmin) {
      return NextResponse.json({ error: "No autorizado: se requiere sesión activa." }, { status: 401 });
    }
    if (isAdminPage || isCreadorPage) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  try {
    const supabaseClient = createClient(supabaseUrl!, supabaseKey!);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      if (isApiAdmin) {
        return NextResponse.json({ error: "Sesión inválida o expirada." }, { status: 401 });
      }
      if (isAdminPage || isCreadorPage) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return NextResponse.next();
    }

    // 1. Intentar buscar el rol del usuario por su ID de autenticación directamente
    let { data: usuario } = await supabaseClient
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .maybeSingle() as { data: { role: string } | null };

    // 2. Logic de Fallback: Si no se encuentra por el ID de Auth, buscamos por Email
    if (!usuario && user.email) {
      const { data: usuarioByEmail } = await supabaseClient
        .from('usuarios')
        .select('id, role, auth_id')
        .eq('email', user.email)
        .maybeSingle() as { data: { id: string; role: string; auth_id: string | null } | null };
      
      if (usuarioByEmail) {
        usuario = { role: usuarioByEmail.role };
        
        // Auto-sanación: Vinculamos el auth_id de Supabase con el registro en la tabla usuarios
        if (!usuarioByEmail.auth_id) {
          await supabaseClient
            .from('usuarios')
            .update({ auth_id: user.id })
            .eq('id', usuarioByEmail.id);
        }
      }
    }

    // Normalizamos el rol a minúsculas para comparaciones consistentes
    const role = (usuario?.role?.toLowerCase()) ?? 'cliente';

    // Protección de rutas administrativas (páginas y APIs)
    if (isAdminPage && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (isApiAdmin && role !== 'admin') {
      return NextResponse.json({ error: "Acceso denegado: se requieren permisos de administrador." }, { status: 403 });
    }
    
    // Protección de rutas de creadores (los admins tienen acceso total por defecto)
    if (isCreadorPage && role !== 'creador' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  } catch (err) {
    console.error("Middleware error:", err);
    if (isApiAdmin) {
      return NextResponse.json({ error: "Error interno al verificar permisos." }, { status: 500 });
    }
    if (isAdminPage || isCreadorPage) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

// Configuración de las rutas que interceptará este middleware
export const config = {
  matcher: [
    '/admin/:path*', 
    '/creador/:path*', 
    '/api/admin/:path*'
  ],
};
