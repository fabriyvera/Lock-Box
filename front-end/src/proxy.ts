import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Public shells contain no seller data. Express verifies the JWT for every API call.
  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/vendedor" ||
    request.nextUrl.pathname.startsWith("/vendedor/")
  ) {
    return NextResponse.next({ request });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Ejecuta el proxy en todas las rutas excepto:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - archivos con extensión (imágenes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
