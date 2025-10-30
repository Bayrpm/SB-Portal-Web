import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

// Define las rutas protegidas y los roles permitidos para cada una
const routeRoles: Record<string, string[]> = {
    '/portal/dashboard': ['administrador'],
    '/portal/usuarios': ['administrador'],
    '/portal/catalogos': ['administrador'],
    '/portal/catalogos/inspectores': ['administrador'],
    // Rutas accesibles para todos los usuarios autenticados:
    // '/portal/denuncias': ['administrador', 'operador'],
    // '/portal/derivaciones': ['administrador', 'operador'],
};

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Solo aplica protección a rutas bajo /portal
    if (!pathname.startsWith('/portal')) {
        return NextResponse.next();
    }

    try {
        // Crear cliente de Supabase y obtener la sesión del usuario
        const { supabase } = createClient(req);
        const { data: { session } } = await supabase.auth.getSession();

        // Si no hay sesión, redirige al login
        if (!session) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Obtener el usuario_id del token
        const userId = session.user.id;

        // Consultar el rol del usuario desde usuarios_portal
        const { data: usuario, error } = await supabase
            .from('usuarios_portal')
            .select('rol_id, activo')
            .eq('usuario_id', userId)
            .single();

        // Si hay error o el usuario no existe, redirige al login
        if (error || !usuario) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Si el usuario no está activo, redirige al login
        if (!usuario.activo) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Obtener el nombre del rol desde la tabla de roles_portal
        const { data: rol } = await supabase
            .from('roles_portal')
            .select('nombre')
            .eq('id', usuario.rol_id)
            .single(); const rolNombre = rol?.nombre?.toLowerCase() || '';

        // Verificar si la ruta actual requiere permisos específicos
        for (const route in routeRoles) {
            if (pathname.startsWith(route)) {
                const allowedRoles = routeRoles[route];

                // Si el rol del usuario no está en la lista de permitidos
                if (!allowedRoles.includes(rolNombre)) {
                    // En vez de redirigir, retornamos una respuesta con header personalizado
                    // que el frontend detectará para mostrar el alert
                    const response = NextResponse.next();
                    response.headers.set('x-middleware-unauthorized', 'true');
                    response.headers.set('x-middleware-message', `Tu usuario no cuenta con el rol necesario para acceder a esta página. Se requiere rol: ${allowedRoles.join(' o ')}`);
                    return response;
                }
            }
        }

        // Si pasa todas las validaciones, permite el acceso
        return NextResponse.next();

    } catch (error) {
        console.error('Error en middleware:', error);
        // Si hay algún error inesperado, permite continuar pero loguea el error
        return NextResponse.next();
    }
}

// Configura el matcher para aplicar el middleware solo a rutas bajo /portal
export const config = {
    matcher: ['/portal/:path*'],
};
