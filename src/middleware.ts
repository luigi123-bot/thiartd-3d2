import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  role?: string;
  user_metadata?: {
    role?: string;
  };
}

function isValidToken(token: unknown): token is DecodedToken {
  return (
    typeof token === 'object' &&
    token !== null &&
    (
      typeof (token as DecodedToken).role === 'string' ||
      typeof (token as DecodedToken).user_metadata?.role === 'string'
    )
  );
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded: unknown = jwtDecode(token);
    if (isValidToken(decoded)) return decoded;
    return null;
  } catch {
    return null;
  }
}

function getUserRoleFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return decoded.role ?? decoded.user_metadata?.role ?? null;
}

// Rutas protegidas con roles permitidos
const protectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'], // Solo administradores
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Revisión de rutas protegidas
  for (const route in protectedRoutes) {
    if (pathname.startsWith(route)) {
      const allowedRoles = protectedRoutes[route];
      if (!allowedRoles) continue;

      const userRole = getUserRoleFromRequest(req);

      console.log(`[Middleware] Intento de acceso a ${pathname} con rol: ${userRole}`);

      if (!userRole || !allowedRoles.includes(userRole)) {
        console.warn(`[Middleware] Acceso denegado para ${userRole}. Redirigiendo a /`);
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'], // Protege todo lo que empiece con /admin
};
