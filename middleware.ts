import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  
  
  

  // Rutas públicas que no requieren autenticación
  const publicPaths = ["/", "/not-found", "/unauthorized"];
  if (publicPaths.includes(pathname)) {
    
    return NextResponse.next();
  }

  // Crear cliente de Supabase
  const { supabase, supabaseResponse } = createClient(request);

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  

  // Si no está autenticado y está intentando acceder al portal, redirigir al login
  if (!user && pathname.startsWith("/portal")) {
    
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Si está autenticado y accediendo al portal
  if (user && pathname.startsWith("/portal")) {
    

    try {
      // Obtener el rol del usuario desde usuarios_portal
      const { data: portalUser, error: portalError } = await supabase
        .from("usuarios_portal")
        .select("rol_id, activo")
        .eq("usuario_id", user.id)
        .eq("activo", true)
        .maybeSingle();

      if (portalError) {
        console.error(`❌ Error obteniendo usuario del portal:`, portalError);
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      if (!portalUser) {
        console.warn(`❌ Usuario sin rol o inactivo: ${user.id}`);
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      

      // Dashboard siempre está permitido
      if (pathname === "/portal/dashboard") {
        
        return supabaseResponse;
      }

      // Obtener las páginas permitidas para este rol directamente de la base de datos
      const { data: rolePages, error: rolePagesError } = await supabase
        .from("roles_paginas")
        .select("paginas(id, nombre, path, activo)")
        .eq("rol_id", portalUser.rol_id)
        .eq("paginas.activo", true);

      if (rolePagesError) {
        console.error(`❌ Error obteniendo páginas del rol:`, rolePagesError);
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      // Filtrar páginas activas y mapear a paths
      const allowedPaths = rolePages
        .map((rp: any) => rp.paginas?.path)
        .filter((p: any) => p && p !== null);

      
      

      // Verificar si la ruta actual está permitida (match exacto o prefijo)
      const isAllowed = allowedPaths.some((allowedPath: string) => {
        // Si es exacto
        if (pathname === allowedPath) return true;
        // Si es un subrutas bajo el path permitido
        if (pathname.startsWith(allowedPath + "/")) return true;
        return false;
      });

      if (isAllowed) {
        
        return supabaseResponse;
      } else {
        console.warn(`❌ ACCESO DENEGADO a ${pathname} para usuario ${user.email} (rol: ${portalUser.rol_id})`);
        console.warn(`   Rutas permitidas: ${allowedPaths.join(", ")}`);
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error(`❌ Error en middleware:`, error);
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
