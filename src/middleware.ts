import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getUserRoleFromDB(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', userId)
    .single();
  return typeof data?.role === 'string' ? data.role : null;
}

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('sb-access-token')?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  interface DecodedToken {
    sub?: string;
    user_id?: string;
    [key: string]: unknown;
  }

  let userId: string | null = null;
  try {
    const decoded = jwtDecode<DecodedToken>(accessToken);
    userId = decoded.sub ?? decoded.user_id ?? null;
  } catch {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const role = await getUserRoleFromDB(userId);
  if (req.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};