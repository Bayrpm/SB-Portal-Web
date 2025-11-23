import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/users/allowed-pages
 * 
 * Obtiene el listado de páginas que el usuario autenticado tiene permitido acceder
 * según su rol. Este endpoint es público para usuarios autenticados, no requiere
 * permisos de administración.
 * 
 * @returns {
 *   success: boolean,
 *   paginas: Array<{ id: string, nombre: string, titulo: string, path: string }>
 * }
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Verificar autenticación
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "No autenticado" },
                { status: 401 }
            );
        }

        // Obtener el rol del usuario desde la BD
        const { data: userPortal, error: userPortalError } = await supabase
            .from("usuarios_portal")
            .select("rol_id, activo")
            .eq("usuario_id", user.id)
            .maybeSingle();

        if (userPortalError || !userPortal) {
            console.error("Error obteniendo usuario del portal:", userPortalError);
            return NextResponse.json(
                { error: "Usuario no encontrado en portal" },
                { status: 401 }
            );
        }

        // Verificar que el usuario esté activo
        if (!userPortal.activo) {
            console.warn(`[/api/users/allowed-pages] Usuario ${user.id} está inactivo.`);
            return NextResponse.json(
                { error: "Usuario inactivo" },
                { status: 403 }
            );
        }

        console.log(
            `[/api/users/allowed-pages] Usuario ${user.id} con rol_id=${userPortal.rol_id} solicita sus páginas permitidas`
        );

        // Obtener las páginas permitidas para el rol del usuario
        const { data: rolePages, error: rolePagesError } = await supabase
            .from("roles_paginas")
            .select(
                `
                pagina_id,
                paginas (
                  id,
                  nombre,
                  titulo,
                  path,
                  activo
                )
            `
            )
            .eq("rol_id", userPortal.rol_id);

        if (rolePagesError) {
            console.error(
                `Error obteniendo páginas del rol ${userPortal.rol_id}:`,
                rolePagesError
            );
            return NextResponse.json(
                { error: "Error al obtener páginas permitidas" },
                { status: 500 }
            );
        }

        if (!rolePages || rolePages.length === 0) {
            console.warn(
                `[/api/users/allowed-pages] Rol ${userPortal.rol_id} no tiene páginas permitidas`
            );
            return NextResponse.json({
                success: true,
                paginas: [],
            });
        }

        // Filtrar solo páginas activas y mapear al formato correcto
        interface PageData {
            id: string;
            nombre: string;
            titulo: string;
            path: string;
            activo: boolean;
        }

        interface RolePaginasRow {
            pagina_id: string;
            paginas: PageData | PageData[] | null;
        }

        const activePaginas = (rolePages as RolePaginasRow[])
            .flatMap((rp) => {
                // paginas puede ser un objeto o un array
                if (rp.paginas === null) return [];
                if (Array.isArray(rp.paginas)) return rp.paginas;
                return [rp.paginas];
            })
            .filter((p) => p.activo)
            .map((p) => ({
                id: p.id,
                nombre: p.nombre,
                titulo: p.titulo,
                path: p.path,
            }))
            .sort((a, b) => {
                // Orden personalizado por rol
                if (userPortal.rol_id === 1) {
                    // Admin: dashboard primero
                    if (a.path === "/portal/dashboard") return -1;
                    if (b.path === "/portal/dashboard") return 1;
                }
                // Por defecto: orden alfabético por path
                return a.path.localeCompare(b.path);
            });

        console.log(
            `[/api/users/allowed-pages] ✅ Usuario ${user.id} tiene ${activePaginas.length} páginas permitidas`
        );
        if (activePaginas.length > 0) {
            console.log(
                `[/api/users/allowed-pages] Páginas:`,
                activePaginas.map((p) => p.path).join(", ")
            );
        }

        return NextResponse.json({
            success: true,
            paginas: activePaginas,
        });
    } catch (error) {
        console.error("Error en /api/users/allowed-pages GET:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
