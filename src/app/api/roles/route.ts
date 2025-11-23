import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPageAccess } from "@/lib/security/checkPageAccess";

// GET: Obtener todos los roles con sus usuarios y páginas asignadas
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

        // Obtener roles
        const { data: roles, error: rolesError } = await supabase
            .from("roles_portal")
            .select("id, nombre, descripcion")
            .order("nombre");

        if (rolesError) {
            console.error("Error obteniendo roles:", rolesError);
            return NextResponse.json({ error: rolesError.message }, { status: 500 });
        }

        // Para cada rol, obtener usuarios y páginas
        const rolesCompletos = await Promise.all(
            (roles || []).map(async (rol) => {
                // Obtener IDs de usuarios del rol
                const { data: usuariosPortal, error: usuariosError } = await supabase
                    .from("usuarios_portal")
                    .select("usuario_id, activo")
                    .eq("rol_id", rol.id)
                    .eq("activo", true);

                if (usuariosError) {
                    console.error(`Error obteniendo usuarios del rol ${rol.id}:`, usuariosError);
                }

                // Obtener perfiles de esos usuarios
                interface UsuarioCompleto {
                    usuario_id: string;
                    activo: boolean;
                    perfiles_ciudadanos: { usuario_id: string; nombre: string; apellido: string; email: string } | undefined;
                }

                let usuariosCompletos: UsuarioCompleto[] = [];
                if (usuariosPortal && usuariosPortal.length > 0) {
                    const userIds = usuariosPortal.map(u => u.usuario_id);
                    const { data: perfiles } = await supabase
                        .from("perfiles_ciudadanos")
                        .select("usuario_id, nombre, apellido, email")
                        .in("usuario_id", userIds);

                    usuariosCompletos = usuariosPortal.map(up => ({
                        usuario_id: up.usuario_id,
                        activo: up.activo,
                        perfiles_ciudadanos: perfiles?.find(p => p.usuario_id === up.usuario_id)
                    }));
                }

                // Obtener páginas del rol
                const { data: paginas, error: paginasError } = await supabase
                    .from("roles_paginas")
                    .select(`
                        pagina_id,
                        paginas (
                            id,
                            nombre,
                            titulo,
                            path,
                            activo
                        )
                    `)
                    .eq("rol_id", rol.id);

                if (paginasError) {
                    console.error(`Error obteniendo páginas del rol ${rol.id}:`, paginasError);
                }

                return {
                    ...rol,
                    usuarios: usuariosCompletos,
                    paginas: paginas?.map(p => p.paginas) || []
                };
            })
        );

        return NextResponse.json({ roles: rolesCompletos });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// POST: Crear un nuevo rol
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

        const { nombre, descripcion } = body;

        if (!nombre) {
            return NextResponse.json({ error: "El nombre del rol es requerido" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("roles_portal")
            .insert({ nombre, descripcion })
            .select()
            .single();

        if (error) {
            console.error("Error creando rol:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ rol: data }, { status: 201 });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// PUT: Actualizar un rol existente
export async function PUT(request: Request) {
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

        const { id, nombre, descripcion } = body;

        if (!id || !nombre) {
            return NextResponse.json({ error: "ID y nombre son requeridos" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("roles_portal")
            .update({ nombre, descripcion })
            .eq("id", id)
            .select()
            .maybeSingle();

        if (error) {
            console.error("Error actualizando rol:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        if (!data) {
            return NextResponse.json({ error: "No se encontró el rol a actualizar" }, { status: 404 });
        }

        return NextResponse.json({ rol: data });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// DELETE: Eliminar un rol (solo si no tiene usuarios asignados)
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
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID del rol es requerido" }, { status: 400 });
        }

        // Verificar que no tenga usuarios asignados
        const { data: usuarios, error: usuariosError } = await supabase
            .from("usuarios_portal")
            .select("usuario_id")
            .eq("rol_id", id)
            .limit(1);

        if (usuariosError) {
            console.error("Error verificando usuarios:", usuariosError);
            return NextResponse.json({ error: usuariosError.message }, { status: 500 });
        }

        if (usuarios && usuarios.length > 0) {
            return NextResponse.json({ error: "No se puede eliminar un rol con usuarios asignados" }, { status: 400 });
        }

        // Eliminar relaciones con páginas
        await supabase
            .from("roles_paginas")
            .delete()
            .eq("rol_id", id);

        // Eliminar el rol
        const { error } = await supabase
            .from("roles_portal")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error eliminando rol:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}