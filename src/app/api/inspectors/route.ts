// Forzamos el uso del runtime de Node.js para operaciones con service-role
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { checkPageAccess } from "@/lib/security/checkPageAccess";

const CHILEAN_PHONE_REGEX = /^\+56\s?9\s?\d{4}\s?\d{4}$/;

export async function POST(req: NextRequest) {
    return registerInspector(req);
}

export async function GET() {
    return getInspectors();
}

export async function PUT(req: NextRequest) {
    return updateInspector(req);
}

export async function DELETE(req: NextRequest) {
    return deleteInspector(req);
}

async function getInspectors() {
    try {
        const supabase = await createServerClient();

        // Verificar autenticación y autorización
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const hasAccess = await checkPageAccess(supabase, user.id, "/portal/catalogos/inspectores");
        if (!hasAccess) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        console.log("Obteniendo lista de inspectores...");

        // Consultar inspectores con información relacionada
        const { data, error } = await supabaseAdmin
            .from("inspectores")
            .select(`
                id,
                usuario_id,
                tipo_turno,
                activo,
                perfiles_ciudadanos!inner (
                    nombre,
                    apellido,
                    email,
                    telefono
                ),
                turno_tipo!inner (
                    id,
                    nombre,
                    hora_inicio,
                    hora_termino
                )
            `)
            .order("id", { ascending: true });

        if (error) {
            console.error("Error obteniendo inspectores:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Formatear datos para el frontend
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inspectors = data?.map((inspector: any, index: number) => {
            const perfil = Array.isArray(inspector.perfiles_ciudadanos)
                ? inspector.perfiles_ciudadanos[0]
                : inspector.perfiles_ciudadanos;
            const turno = Array.isArray(inspector.turno_tipo)
                ? inspector.turno_tipo[0]
                : inspector.turno_tipo;

            return {
                id: inspector.usuario_id,
                numero: index + 1,
                name: `${perfil.nombre} ${perfil.apellido}`,
                email: perfil.email,
                telefono: perfil.telefono || "",
                activo: inspector.activo,
                turno: {
                    id: turno.id,
                    nombre: turno.nombre,
                    hora_inicio: turno.hora_inicio,
                    hora_termino: turno.hora_termino,
                }
            };
        }) || [];

        console.log(`Se encontraron ${inspectors.length} inspectores`);
        return NextResponse.json({ inspectors });

    } catch (error) {
        console.error("Excepción obteniendo inspectores:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado obteniendo inspectores"
        }, { status: 500 });
    }
}

async function registerInspector(req: NextRequest) {
    const supabase = await createServerClient();

    // Verificar autenticación y autorización
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const hasAccess = await checkPageAccess(supabase, user.id, "/portal/catalogos/inspectores");
    if (!hasAccess) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { email, password, name, last_name, phone, turno_id } = await req.json();

    // Validaciones
    if (!email || !password) {
        return NextResponse.json({ error: "Email y password requeridos" }, { status: 400 });
    }
    if (phone && !CHILEAN_PHONE_REGEX.test(phone)) {
        return NextResponse.json({ error: "El número de teléfono debe tener formato chileno: +56 9 XXXX XXXX" }, { status: 400 });
    }
    if (name == null || last_name == null) {
        return NextResponse.json({ error: "Nombre y apellido son requeridos" }, { status: 400 });
    }
    if (!turno_id) {
        return NextResponse.json({ error: "El turno es requerido" }, { status: 400 });
    }

    try {
        // 1) Crear usuario en auth.users con service role (server-side)
        console.log("Intentando crear inspector con Supabase Admin...");
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { name, last_name, phone: phone || "" },
            email_confirm: true
        });

        if (createErr) {
            console.error("Error creando usuario:", createErr);
            return NextResponse.json({ error: createErr.message }, { status: 500 });
        }

        if (!created?.user) {
            console.error("No se obtuvo información del usuario creado");
            return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
        }

        const usuario_id = created.user.id;
        console.log("Usuario creado correctamente:", usuario_id);
        console.log("Perfil ciudadano se creará automáticamente por trigger");

        // 2) Insertar en tabla inspectores con service role
        let inspectorError;
        try {
            console.log("Insertando en inspectores...");
            const result = await supabaseAdmin
                .from("inspectores")
                .insert([{
                    usuario_id,
                    tipo_turno: turno_id,
                    activo: true
                }]);

            inspectorError = result.error;

            if (inspectorError) {
                console.error("Error insertando en inspectores:", inspectorError);
                console.log("Intentando método alternativo...");

                // Método alternativo usando createServerClient
                const supabaseServer = await createServerClient();
                const serverResult = await supabaseServer
                    .from("inspectores")
                    .insert([{
                        usuario_id,
                        tipo_turno: turno_id,
                        activo: true
                    }]);

                if (serverResult.error) {
                    console.error("Error con método alternativo:", serverResult.error);
                    inspectorError = serverResult.error;
                } else {
                    console.log("Método alternativo exitoso");
                    inspectorError = null;
                }
            }
        } catch (insertError) {
            console.error("Excepción insertando en inspectores:", insertError);
            inspectorError = { message: insertError instanceof Error ? insertError.message : String(insertError) };
        }

        if (inspectorError) {
            console.error("Error final insertando en inspectores:", inspectorError);
            // Rollback: eliminar usuario (el perfil se eliminará automáticamente en cascada)
            try {
                await supabaseAdmin.auth.admin.deleteUser(usuario_id);
                console.log("Usuario eliminado en rollback");
            } catch (deleteError) {
                console.error("Error durante rollback:", deleteError);
            }
            return NextResponse.json({ error: inspectorError.message }, { status: 500 });
        }

        console.log("Inspector registrado completamente con éxito");
        return NextResponse.json({
            success: true,
            user: created.user,
            message: "Inspector creado exitosamente"
        });

    } catch (error) {
        console.error("Excepción durante el proceso de registro:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado conectando con Supabase"
        }, { status: 500 });
    }
}

async function updateInspector(req: NextRequest) {
    const supabase = await createServerClient();

    // Verificar autenticación y autorización
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const hasAccess = await checkPageAccess(supabase, user.id, "/portal/catalogos/inspectores");
    if (!hasAccess) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { usuario_id, name, last_name, phone, turno_id } = await req.json();

    // Validaciones
    if (!usuario_id) {
        return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }
    if (phone && !CHILEAN_PHONE_REGEX.test(phone)) {
        return NextResponse.json({ error: "El número de teléfono debe tener formato chileno: +56 9 XXXX XXXX" }, { status: 400 });
    }

    try {
        console.log("Actualizando inspector:", usuario_id);

        // 1) Actualizar user_metadata en auth.users si se proporciona nombre o teléfono
        if (name || last_name || phone) {
            const updateData: { name?: string; last_name?: string; phone?: string } = {};
            if (name !== undefined) updateData.name = name;
            if (last_name !== undefined) updateData.last_name = last_name;
            if (phone !== undefined) updateData.phone = phone;

            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                usuario_id,
                { user_metadata: updateData }
            );

            if (authError) {
                console.error("Error actualizando metadata del usuario:", authError);
                return NextResponse.json({ error: authError.message }, { status: 500 });
            }
            console.log("Metadata de usuario actualizada");
        }

        // 2) Actualizar perfiles_ciudadanos si es necesario
        if (name || last_name || phone) {
            const updateData: { nombre?: string; apellido?: string; telefono?: string | null } = {};
            if (name !== undefined) updateData.nombre = name;
            if (last_name !== undefined) updateData.apellido = last_name;
            if (phone !== undefined) updateData.telefono = phone || null;

            const { error: perfilError } = await supabaseAdmin
                .from("perfiles_ciudadanos")
                .update(updateData)
                .eq("usuario_id", usuario_id);

            if (perfilError) {
                console.error("Error actualizando perfil:", perfilError);
                return NextResponse.json({ error: perfilError.message }, { status: 500 });
            }
            console.log("Perfil actualizado");
        }

        // 3) Actualizar turno en inspectores si se proporciona
        if (turno_id) {
            const { error: inspectorError } = await supabaseAdmin
                .from("inspectores")
                .update({ tipo_turno: turno_id })
                .eq("usuario_id", usuario_id);

            if (inspectorError) {
                console.error("Error actualizando turno del inspector:", inspectorError);
                return NextResponse.json({ error: inspectorError.message }, { status: 500 });
            }
            console.log("Turno del inspector actualizado");
        }

        return NextResponse.json({
            success: true,
            message: "Inspector actualizado exitosamente"
        });

    } catch (error) {
        console.error("Excepción actualizando inspector:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado actualizando inspector"
        }, { status: 500 });
    }
}

async function deleteInspector(req: NextRequest) {
    const supabase = await createServerClient();

    // Verificar autenticación y autorización
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const hasAccess = await checkPageAccess(supabase, user.id, "/portal/catalogos/inspectores");
    if (!hasAccess) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const url = new URL(req.url);
    const usuario_id = url.searchParams.get("usuario_id");

    if (!usuario_id) {
        return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    try {
        console.log("Eliminando inspector:", usuario_id);

        // 1) Eliminar de tabla inspectores
        console.log("Eliminando de inspectores...");
        const { error: inspectorError } = await supabaseAdmin
            .from("inspectores")
            .delete()
            .eq("usuario_id", usuario_id);

        if (inspectorError) {
            console.error("Error eliminando de inspectores:", inspectorError);
            return NextResponse.json({ error: inspectorError.message }, { status: 500 });
        }
        console.log("Registro de inspectores eliminado");

        // 2) Eliminar de perfiles_ciudadanos
        console.log("Eliminando de perfiles_ciudadanos...");
        const { error: perfilError } = await supabaseAdmin
            .from("perfiles_ciudadanos")
            .delete()
            .eq("usuario_id", usuario_id);

        if (perfilError) {
            console.error("Error eliminando perfil:", perfilError);
            return NextResponse.json({ error: perfilError.message }, { status: 500 });
        }
        console.log("Perfil ciudadano eliminado");

        // 3) Eliminar de auth.users (esto debe ser lo último)
        console.log("Eliminando usuario de auth...");
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(usuario_id);

        if (authError) {
            console.error("Error eliminando usuario de auth:", authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }
        console.log("Usuario eliminado de auth");

        return NextResponse.json({
            success: true,
            message: "Inspector eliminado exitosamente"
        });

    } catch (error) {
        console.error("Excepción eliminando inspector:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado eliminando inspector"
        }, { status: 500 });
    }
}
