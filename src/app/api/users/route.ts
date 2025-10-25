// Forzamos el uso del runtime de Node.js para operaciones con service-role
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const CHILEAN_PHONE_REGEX = /^\+56\s?9\s?\d{4}\s?\d{4}$/;

export async function POST(req: NextRequest) {
    return registerStaff(req);
}

export async function PUT(req: NextRequest) {
    return updateUser(req);
}

export async function DELETE(req: NextRequest) {
    return deleteUser(req);
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Email es requerido" }, { status: 400 });

    const result = await getUserInfo(email);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
}

async function registerStaff(req: NextRequest) {
    const { email, password, name, last_name, phone, rol_id } = await req.json();

    if (!email || !password) {
        return NextResponse.json({ error: "Email y password requeridos" }, { status: 400 });
    }
    if (phone && !CHILEAN_PHONE_REGEX.test(phone)) {
        return NextResponse.json({ error: "El número de teléfono debe tener formato chileno: +56 9 XXXX XXXX" }, { status: 400 });
    }
    if (name == null || last_name == null) {
        return NextResponse.json({ error: "Nombre y apellido son requeridos" }, { status: 400 });
    }

    try {
        // 1) Crear usuario con service role (server-side)
        console.log("Intentando crear usuario con Supabase Admin...");
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

        // 2) Insertar en usuarios_portal con service role (evita problemas de permisos/RLS)
        let portalError;
        try {
            console.log("Insertando en usuarios_portal...");
            const result = await supabaseAdmin
                .from("usuarios_portal")
                .insert([{ usuario_id, rol_id, activo: true }]);

            portalError = result.error;

            if (portalError) {
                console.error("Error insertando en usuarios_portal:", portalError);
                console.log("Intentando método alternativo...");

                // Método alternativo usando createServerClient
                const supabaseServer = await createServerClient();
                const serverResult = await supabaseServer
                    .from("usuarios_portal")
                    .insert([{ usuario_id, rol_id, activo: true }]);

                if (serverResult.error) {
                    console.error("Error con método alternativo:", serverResult.error);
                    portalError = serverResult.error;
                } else {
                    console.log("Método alternativo exitoso");
                    portalError = null;
                }
            }
        } catch (insertError) {
            console.error("Excepción insertando en usuarios_portal:", insertError);
            portalError = { message: insertError instanceof Error ? insertError.message : String(insertError) };
        }

        if (portalError) {
            console.error("Error final insertando en usuarios_portal:", portalError);
            // rollback: borra el usuario recién creado
            try {
                await supabaseAdmin.auth.admin.deleteUser(usuario_id);
                console.log("Usuario eliminado en rollback");
            } catch (deleteError) {
                console.error("Error durante rollback:", deleteError);
            }
            return NextResponse.json({ error: portalError.message }, { status: 500 });
        }

        console.log("Usuario registrado completamente con éxito");
        return NextResponse.json({ user: created.user });

    } catch (error) {
        console.error("Excepción durante el proceso de registro:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado conectando con Supabase"
        }, { status: 500 });
    }
}

// Si quieres mantener GET con sesión del usuario (no requiere service role)
async function getUserInfo(email: string) {
    const supabase = await createServerClient();

    const { data: perfil, error: errorPerfil } = await supabase
        .from("perfiles_ciudadanos")
        .select("usuario_id, nombre, apellido")
        .eq("email", email)
        .maybeSingle();

    if (errorPerfil) return { error: "Error al obtener perfil del usuario." };
    if (!perfil?.usuario_id) return { error: "No se encontró información del usuario." };

    const { data: usuario, error: errorUsuario } = await supabase
        .from("usuarios_portal")
        .select("rol_id")
        .eq("usuario_id", perfil.usuario_id)
        .maybeSingle();

    if (errorUsuario) return { error: "Error al obtener información del usuario." };
    if (!usuario) return { error: "No se encontró información del usuario." };

    const nombre = perfil.nombre ?? "";
    const apellido = perfil.apellido ?? "";
    return { role: usuario.rol_id, name: `${nombre} ${apellido}`.trim() };
}

async function updateUser(req: NextRequest) {
    const { id, name, last_name, phone, rol_id, activo } = await req.json();

    if (!id) {
        return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    if (phone && !CHILEAN_PHONE_REGEX.test(phone)) {
        return NextResponse.json({
            error: "El número de teléfono debe tener formato chileno: +56 9 XXXX XXXX"
        }, { status: 400 });
    }

    try {
        // Actualizar metadata del usuario si se proporcionan name, last_name o phone
        if (name !== undefined || last_name !== undefined || phone !== undefined) {
            const updateData: { user_metadata: { name?: string; last_name?: string; phone?: string } } = {
                user_metadata: {}
            };

            if (name !== undefined) updateData.user_metadata.name = name;
            if (last_name !== undefined) updateData.user_metadata.last_name = last_name;
            if (phone !== undefined) updateData.user_metadata.phone = phone;

            const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
                id,
                updateData
            );

            if (metadataError) {
                console.error("Error actualizando metadata:", metadataError);
                return NextResponse.json({ error: metadataError.message }, { status: 500 });
            }

            // Actualizar también en perfiles_ciudadanos
            const perfilUpdate: { nombre?: string; apellido?: string; telefono?: string } = {};
            if (name !== undefined) perfilUpdate.nombre = name;
            if (last_name !== undefined) perfilUpdate.apellido = last_name;
            if (phone !== undefined) perfilUpdate.telefono = phone;

            const { error: perfilError } = await supabaseAdmin
                .from("perfiles_ciudadanos")
                .update(perfilUpdate)
                .eq("usuario_id", id);

            if (perfilError) {
                console.error("Error actualizando perfil:", perfilError);
            }
        }

        // Actualizar rol_id o activo en usuarios_portal si se proporcionan
        if (rol_id !== undefined || activo !== undefined) {
            const portalUpdate: { rol_id?: number; activo?: boolean } = {};
            if (rol_id !== undefined) portalUpdate.rol_id = rol_id;
            if (activo !== undefined) portalUpdate.activo = activo;

            const { error: portalError } = await supabaseAdmin
                .from("usuarios_portal")
                .update(portalUpdate)
                .eq("usuario_id", id);

            if (portalError) {
                console.error("Error actualizando usuarios_portal:", portalError);
                return NextResponse.json({ error: portalError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, message: "Usuario actualizado correctamente" });

    } catch (error) {
        console.error("Error actualizando usuario:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado"
        }, { status: 500 });
    }
}

async function deleteUser(req: NextRequest) {
    const { id } = await req.json();

    if (!id) {
        return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    try {
        // 1. Eliminar de usuarios_portal
        const { error: portalError } = await supabaseAdmin
            .from("usuarios_portal")
            .delete()
            .eq("usuario_id", id);

        if (portalError) {
            console.error("Error eliminando de usuarios_portal:", portalError);
            return NextResponse.json({ error: portalError.message }, { status: 500 });
        }

        // 2. Eliminar de perfiles_ciudadanos
        const { error: perfilError } = await supabaseAdmin
            .from("perfiles_ciudadanos")
            .delete()
            .eq("usuario_id", id);

        if (perfilError) {
            console.error("Error eliminando perfil:", perfilError);
        }

        // 3. Eliminar usuario de auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.error("Error eliminando usuario de auth:", authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Usuario eliminado correctamente" });

    } catch (error) {
        console.error("Error eliminando usuario:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado"
        }, { status: 500 });
    }
}
