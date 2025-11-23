import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPageAccess } from "@/lib/security/checkPageAccess";

// POST: Cambiar el rol de un usuario
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

        const { usuario_id, rol_id } = body;

        if (!usuario_id || !rol_id) {
            return NextResponse.json({ error: "usuario_id y rol_id son requeridos" }, { status: 400 });
        }

        // Actualizar el rol del usuario
        const { data, error } = await supabase
            .from("usuarios_portal")
            .update({ rol_id })
            .eq("usuario_id", usuario_id)
            .select()
            .single();

        if (error) {
            console.error("Error actualizando rol del usuario:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, usuario: data });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// GET: Obtener todos los usuarios del portal para asignar roles
export async function GET() {
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

        // Obtener usuarios_portal con sus roles
        const { data: usuariosPortal, error } = await supabase
            .from("usuarios_portal")
            .select(`
                usuario_id,
                rol_id,
                activo,
                roles_portal (
                    id,
                    nombre
                )
            `);

        if (error) {
            console.error("Error obteniendo usuarios:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Obtener perfiles de esos usuarios
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let usuariosCompletos: any[] = [];
        if (usuariosPortal && usuariosPortal.length > 0) {
            const userIds = usuariosPortal.map(u => u.usuario_id);
            const { data: perfiles } = await supabase
                .from("perfiles_ciudadanos")
                .select("usuario_id, nombre, apellido, email")
                .in("usuario_id", userIds);

            usuariosCompletos = usuariosPortal.map(up => ({
                ...up,
                perfiles_ciudadanos: perfiles?.find(p => p.usuario_id === up.usuario_id)
            }));

            // Ordenar por nombre
            usuariosCompletos.sort((a, b) => {
                const nombreA = a.perfiles_ciudadanos?.nombre || '';
                const nombreB = b.perfiles_ciudadanos?.nombre || '';
                return nombreA.localeCompare(nombreB);
            });
        }

        return NextResponse.json({ usuarios: usuariosCompletos });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
