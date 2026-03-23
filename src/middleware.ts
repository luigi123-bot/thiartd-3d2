import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const authCookie = req.cookies.get('sb-access-token')?.value;
  
  // Si no hay cookie, permitimos el paso; el frontend se encargará
  if (!authCookie) {
    return NextResponse.next();
  }

  try {
    const supabaseClient = createClient(supabaseUrl!, supabaseKey!);
    const { data: { user } } = await supabaseClient.auth.getUser(authCookie);

    if (user) {
      const { data: usuario } = await supabaseClient
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .single() as { data: { role: string } | null };

      const role = (usuario?.role) ?? 'cliente';

      if (pathname.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      if (pathname.startsWith('/creador') && role !== 'creador' && role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  } catch (err) {
    console.error("Middleware error:", err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/creador/:path*', 
    '/usuario/:path*'
  ],
};
