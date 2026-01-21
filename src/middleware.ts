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

  // Buscar el usuario en la tabla personalizada y obtener su role
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  // Redireccionar según el role
  if (usuario?.role === 'admin' && req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next(); // acceso permitido
  }
  if (usuario?.role === 'user' && req.nextUrl.pathname.startsWith('/user')) {
    return NextResponse.next(); // acceso permitido
  }
  // Si no tiene role o no coincide, redirigir a home
  return NextResponse.redirect(new URL('/', req.url));
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*'],
};
