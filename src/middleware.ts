import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Middleware global de Next.js para control de acceso basado en roles (RBAC).
 * Protege las rutas de /admin y /creador verificando la sesión de Supabase y el rol en la base de datos.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // El token de acceso se almacena en esta cookie (configurado por el cliente de Supabase)
  const authCookie = req.cookies.get('sb-access-token')?.value;
  
  // Si no hay sesión (cookie), permitimos que continúe; la página de destino redirigirá si es necesario
  if (!authCookie) {
    return NextResponse.next();
  }

  try {
    const supabaseClient = createClient(supabaseUrl!, supabaseKey!);
    const { data: { user } } = await supabaseClient.auth.getUser(authCookie);

    if (user) {
      // 1. Intentar buscar el rol del usuario por su ID de autenticación directamente
      let { data: usuario } = await supabaseClient
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .maybeSingle() as { data: { role: string } | null };

      // 2. Logic de Fallback: Si no se encuentra por el ID de Auth, buscamos por Email
      // Útil para usuarios creados manualmente en la BD o migrados desde otros sistemas
      if (!usuario && user.email) {
        const { data: usuarioByEmail } = await supabaseClient
          .from('usuarios')
          .select('id, role, auth_id')
          .eq('email', user.email)
          .maybeSingle() as { data: { id: string; role: string; auth_id: string | null } | null };
        
        if (usuarioByEmail) {
          usuario = { role: usuarioByEmail.role };
          
          // Auto-sanación: Vinculamos el auth_id de Supabase con el registro en la tabla usuarios
          // Esto soluciona problemas de acceso para usuarios con discrepancia de IDs en su primer login
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

      // Protección de rutas administrativas
      if (pathname.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      // Protección de rutas de creadores (los admins tienen acceso total por defecto)
      if (pathname.startsWith('/creador') && role !== 'creador' && role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  } catch (err) {
    console.error("Middleware error:", err);
  }

  return NextResponse.next();
}

// Configuración de las rutas que interceptará este middleware
export const config = {
  matcher: [
    '/admin/:path*', 
    '/creador/:path*', 
    '/usuario/:path*'
  ],
};
