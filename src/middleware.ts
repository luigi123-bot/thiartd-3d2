import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(req: NextRequest) {
  // Obtener el token del usuario (puede variar según tu auth)
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.next();

  // Obtener el usuario desde Supabase
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  const jwt = authHeader.replace('Bearer ', '');
  const { data: userData, error } = await supabase.auth.getUser(jwt);
  if (error || !userData?.user) return NextResponse.next();

  // DEBUG: log del id de usuario obtenido desde el JWT (temporal)
  try {

    console.log('[middleware] supabase auth.getUser -> user id:', userData.user.id);
  } catch {
    // ignore
  }

  // --- TEMPORARY DEV BYPASS ---
  // Durante desarrollo local, permitir acceso a rutas protegidas si el token
  // es válido y devuelve un usuario. Esto evita bloqueos por falta de fila
  // en la tabla `usuario` mientras se depura. NO dejar en producción.
  if (process.env.NODE_ENV !== 'production' && userData.user) {
    try {

      console.log('[middleware] DEV BYPASS: allowing access to protected route for user', userData.user.id);
    } catch { }
    return NextResponse.next();
  }

  // Buscar el usuario en la tabla personalizada y obtener su role
  type Usuario = { role?: string; rol?: string; auth_id?: string };
  // En la base de datos el archivo de helpers usa la tabla `usuario` (singular)
  // y guarda el id del proveedor en `auth_id`. Buscar por ese campo.
  const { data } = await supabase
    .from('usuario')
    // Algunas filas pueden tener `role` o `rol` — solicitar ambos campos
    .select('role, rol, auth_id')
    .eq('auth_id', userData.user.id)
    .single();
  const usuario = data as Usuario | null;
  // DEBUG: log resultado de la consulta a la tabla 'usuario' (temporal)
  try {

    console.log('[middleware] usuario row:', usuario);
  } catch {
    // ignore
  }

  // Redireccionar según el role
  const userRole: string | undefined = usuario?.role ?? usuario?.rol;
  if (userRole === 'admin' && req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next(); // acceso permitido
  }
  if ((usuario?.role === 'user' || usuario?.rol === 'user') && req.nextUrl.pathname.startsWith('/user')) {
    return NextResponse.next(); // acceso permitido
  }
  // Si no tiene role o no coincide, redirigir a home
  return NextResponse.redirect(new URL('/', req.url));
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*'],
};
