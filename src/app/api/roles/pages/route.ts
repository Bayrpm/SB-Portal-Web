import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPageAccess } from "@/lib/security/checkPageAccess";

// GET: Obtener páginas accesibles por un rol específico
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rolIdParam = searchParams.get("rolId");

        if (!rolIdParam) {
            return NextResponse.json(
                { error: "rolId es requerido" },
                { status: 400 }
            );
        }

        // Convertir rolId a número
        const rolId = parseInt(rolIdParam, 10);
        if (isNaN(rolId)) {
            return NextResponse.json(
                { error: "rolId debe ser un número válido" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verificar que el usuario esté autenticado
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

        // Verificar autorización
        const hasAccess = await checkPageAccess(supabase, user.id, "/portal/catalogos/roles");
        if (!hasAccess) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Obtener el rol del usuario actual desde la BD
        const { data: userPortal, error: userPortalError } = await supabase
            .from("usuarios_portal")
            .select("rol_id")
            .eq("usuario_id", user.id)
            .maybeSingle();

        if (userPortalError || !userPortal) {
            console.error("Error obteniendo usuario del portal:", userPortalError);
            return NextResponse.json(
                { error: "Usuario no encontrado en portal" },
                { status: 401 }
            );
        }

        

        // Obtener las páginas asignadas al rol que estén activas
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
            .eq("rol_id", rolId);

        if (rolePagesError) {
            console.error("Error obteniendo páginas del rol:", rolePagesError);
            return NextResponse.json(
                { error: "Error al obtener páginas del rol" },
                { status: 500 }
            );
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
                if (rolId === 1) {
                    // Admin: dashboard primero
                    if (a.path === "/portal/dashboard") return -1;
                    if (b.path === "/portal/dashboard") return 1;
                }
                // Por defecto: orden alfabético por path
                return a.path.localeCompare(b.path);
            });

        
        if (activePaginas.length === 0) {
            
        } else {
            
        }

        return NextResponse.json({
            success: true,
            paginas: activePaginas,
        });
    } catch (error) {
        console.error("Error en /api/roles/pages GET:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

// POST: Asignar una página a un rol
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Verificar autenticación y autorización
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const hasAccess = await checkPageAccess(supabase, user.id, "/portal/catalogos/roles");
        if (!hasAccess) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();

        const { rol_id, pagina_id } = body;

        if (!rol_id || !pagina_id) {
            return NextResponse.json({ error: "rol_id y pagina_id son requeridos" }, { status: 400 });
        }

        // Verificar si ya existe la asignación
        const { data: existing } = await supabase
            .from("roles_paginas")
            .select("id")
            .eq("rol_id", rol_id)
            .eq("pagina_id", pagina_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: "Esta página ya está asignada al rol" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("roles_paginas")
            .insert({ rol_id, pagina_id })
            .select()
            .single();

        if (error) {
            console.error("Error asignando página al rol:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// DELETE: Quitar una página de un rol
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();

        // Verificar autenticación y autorización
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const hasAccess = await checkPageAccess(supabase, user.id, "/portal/catalogos/roles");
        if (!hasAccess) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const rol_id = searchParams.get("rol_id");
        const pagina_id = searchParams.get("pagina_id");

        if (!rol_id || !pagina_id) {
            return NextResponse.json({ error: "rol_id y pagina_id son requeridos" }, { status: 400 });
        }

        const { error } = await supabase
            .from("roles_paginas")
            .delete()
            .eq("rol_id", rol_id)
            .eq("pagina_id", pagina_id);

        if (error) {
            console.error("Error quitando página del rol:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
