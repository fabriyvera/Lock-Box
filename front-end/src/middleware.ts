import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // The academic seller demo has no Supabase dependency or authenticated data.
  // Remove this bypass when the demo adapter is replaced by the authenticated API.
  if (request.nextUrl.pathname === '/vendedor' || request.nextUrl.pathname.startsWith('/vendedor/')) {
    return NextResponse.next({ request });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Ejecuta el middleware en todas las rutas excepto:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - archivos con extensión (imágenes, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};