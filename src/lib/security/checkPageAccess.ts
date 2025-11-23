import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SupabaseType = ReturnType<typeof createClient> extends Promise<infer U>
    ? U
    : never;

// 1. TIPOS CORREGIDOS: La propiedad 'paginas' se tipa ahora como un Array 
// para coincidir con la inferencia de TypeScript y la estructura de PostgREST 
// cuando se configura de forma específica.
type PaginaDetalle = { path: string; activo: boolean };
type RolePageResult = {
    pagina_id: number;
    // paginas es un array (incluso si solo contiene un elemento)
    paginas: PaginaDetalle[] | null;
};

/**
 * Helper para verificar si un usuario tiene acceso a una página específica
 * Compatible con el HOC withPageProtection y el UserContext
 *
 * @param supabase - Cliente de Supabase autenticado
 * @param userId - ID del usuario (uuid)
 * @param pagePath - Ruta de la página a verificar (ej: "/portal/usuarios")
 * @returns boolean - true si el usuario tiene acceso, false en caso contrario
 */
export async function checkPageAccess(
    supabase: SupabaseType,
    userId: string,
    pagePath: string
): Promise<boolean> {
    try {
        // Validar entrada
        if (!userId || !pagePath) {
            console.error("checkPageAccess: userId o pagePath no proporcionados");
            return false;
        }

        // Las rutas públicas siempre son accesibles
        if (pagePath === "/") {
            return true;
        }

        // 1. Obtener el usuario del portal y su rol
        const { data: portalUser, error: portalError } = await supabase
            .from("usuarios_portal")
            .select("rol_id, activo")
            .eq("usuario_id", userId)
            .maybeSingle();

        if (portalError || !portalUser) {
            console.error(
                `checkPageAccess: Usuario ${userId} no encontrado o inactivo`,
                portalError
            );
            return false;
        }

        // 2. Verificar que el usuario esté activo
        if (!portalUser.activo) {
            console.warn(`[checkPageAccess] Usuario ${userId} está inactivo en usuarios_portal.`);
            return false;
        }

        // 3. Obtener las páginas permitidas para el rol del usuario
        const { data: rolePages, error: rolePagesError } = await supabase
            .from("roles_paginas")
            .select(
                `
                pagina_id,
                paginas (
                    path,
                    activo
                )
                `
            )
            .eq("rol_id", portalUser.rol_id);

        if (rolePagesError) {
            console.error(
                `checkPageAccess: Error obteniendo páginas del rol ${portalUser.rol_id}`,
                rolePagesError
            );
            return false;
        }

        if (!rolePages || rolePages.length === 0) {
            console.warn(
                `checkPageAccess: Rol ${portalUser.rol_id} no tiene páginas permitidas`
            );
            return false;
        }

        // 4. CORRECCIÓN DE LÓGICA Y TIPADO: 
        // Se utiliza flatMap para manejar el array de arrays implícito 
        // y se usa el tipo RolePageResult[] para evitar el error TS2352.
        const paginasPermitidas = (rolePages as RolePageResult[])
            .flatMap((rp) => rp.paginas || []) // Aplanar los arrays de páginas, ignorando nulos
            .filter((p) => p.activo) // Filtrar solo las páginas activas
            .map((p) => p.path); // Obtener el path

        console.log(`[checkPageAccess] Páginas permitidas para rol_id ${portalUser.rol_id}:`, paginasPermitidas);

        // 5. Verificar si la ruta solicitada está en las páginas permitidas
        const hasAccess = paginasPermitidas.some((path) => pagePath.startsWith(path));

        if (!hasAccess) {
            console.warn(
                `checkPageAccess: Usuario ${userId} no tiene permiso a ${pagePath} (rol: ${portalUser.rol_id})`
            );
        }

        return hasAccess;
    } catch (error) {
        console.error(`checkPageAccess: Error inesperado verificando acceso:`, error);
        return false;
    }
}

// -----------------------------------------------------------------------------

/**
 * Verifica acceso a una ruta específica de la API
 * Versión simplificada que retorna la respuesta NextResponse si no hay acceso
 *
 * @param supabase - Cliente de Supabase autenticado
 * @param userId - ID del usuario
 * @param pagePath - Ruta de la página a verificar
 * @returns { hasAccess: boolean, response?: NextResponse }
 */
export async function verifyPageAccessWithResponse(
    supabase: SupabaseType,
    userId: string,
    pagePath: string
) {
    const hasAccess = await checkPageAccess(supabase, userId, pagePath);

    if (!hasAccess) {
        return {
            hasAccess: false,
            response: NextResponse.json(
                { error: "No autorizado para acceder a esta funcionalidad" },
                { status: 403 }
            ),
        };
    }

    return { hasAccess: true };
}