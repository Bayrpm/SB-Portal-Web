// Forzamos el uso del runtime de Node.js para operaciones con service-role
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
    createUserSchema,
    updateUserSchema,
    deleteUserSchema,
    getUserByEmailSchema,
    userResponseSchema,
    userInfoResponseSchema,
    successResponseSchema,
    validateInput,
    validateOutput,
    parseQueryParams,
    withAuth,
    rateLimit,
    rateLimitPresets,
    logger
} from '@/lib/validation';

export const POST = withAuth(async (req: NextRequest) => {
    // Rate limiting para creación de usuarios (10 por minuto)
    const rateLimitResponse = await rateLimit(req, rateLimitPresets.critical);
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    return registerStaff(req);
});

export const PUT = withAuth(async (req: NextRequest) => {
    return updateUser(req);
});

export const DELETE = withAuth(async (req: NextRequest) => {
    return deleteUser(req);
});

export const GET = withAuth(async (req: NextRequest) => {
    const params = parseQueryParams(req.url);

    // Validar query params
    const validation = validateInput(getUserByEmailSchema, params);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email } = validation.data;
    const result = await getUserInfo(email);

    if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Validar salida
    const outputValidation = validateOutput(userInfoResponseSchema, result);
    if (!outputValidation.success) {
        logger.error('GET /api/users: error validando salida', { error: outputValidation.error });
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }

    return NextResponse.json(outputValidation.data);
});

async function registerStaff(req: NextRequest) {
    try {
        const body = await req.json();

        // Validar entrada
        const validation = validateInput(createUserSchema, body);
        if (!validation.success) {
            logger.warn('Crear usuario: validación fallida', { error: validation.error });
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { email, password, name, last_name, phone, rol_id } = validation.data;

        logger.info('Intentando crear usuario', { email, rol_id });

        // 1) Crear usuario con service role (server-side)
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { name, last_name, phone: phone || "" },
            email_confirm: true
        });

        if (createErr) {
            logger.error('Error creando usuario en auth', createErr, { email });
            return NextResponse.json({ error: createErr.message }, { status: 500 });
        }

        if (!created?.user) {
            logger.error('No se obtuvo información del usuario creado', { email });
            return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
        }

        const usuario_id = created.user.id;
        logger.debug('Usuario creado en auth', { usuario_id, email });

        // 2) Insertar en usuarios_portal con service role
        let portalError;
        try {
            const result = await supabaseAdmin
                .from("usuarios_portal")
                .insert([{ usuario_id, rol_id, activo: true }]);

            portalError = result.error;

            if (portalError) {
                logger.warn('Error insertando en usuarios_portal, intentando método alternativo', {
                    error: portalError.message
                });

                // Método alternativo usando createServerClient
                const supabaseServer = await createServerClient();
                const serverResult = await supabaseServer
                    .from("usuarios_portal")
                    .insert([{ usuario_id, rol_id, activo: true }]);

                if (serverResult.error) {
                    logger.error('Error con método alternativo', serverResult.error);
                    portalError = serverResult.error;
                } else {
                    logger.debug('Método alternativo exitoso');
                    portalError = null;
                }
            }
        } catch (insertError) {
            logger.error('Excepción insertando en usuarios_portal', insertError instanceof Error ? insertError : undefined);
            portalError = { message: insertError instanceof Error ? insertError.message : String(insertError) };
        }

        if (portalError) {
            logger.error('Error final insertando en usuarios_portal, ejecutando rollback', portalError);
            // rollback: borra el usuario recién creado
            try {
                await supabaseAdmin.auth.admin.deleteUser(usuario_id);
                logger.info('Usuario eliminado en rollback', { usuario_id });
            } catch (deleteError) {
                logger.error('Error durante rollback', deleteError instanceof Error ? deleteError : undefined);
            }
            return NextResponse.json({ error: portalError.message }, { status: 500 });
        }

        // Validar salida
        const responseData = { user: created.user };
        const outputValidation = validateOutput(userResponseSchema, responseData);

        if (!outputValidation.success) {
            logger.error('Crear usuario: error validando salida', { error: outputValidation.error });
            return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
        }

        logger.info('Usuario creado exitosamente', { usuario_id, email, rol_id });
        return NextResponse.json(outputValidation.data);

    } catch (error) {
        logger.error('Excepción durante registro de usuario', error instanceof Error ? error : undefined);
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
    try {
        const body = await req.json();

        // Validar entrada
        const validation = validateInput(updateUserSchema, body);
        if (!validation.success) {
            logger.warn('Actualizar usuario: validación fallida', { error: validation.error });
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { id, name, last_name, phone, rol_id, activo } = validation.data;

        logger.info('Actualizando usuario', { id });

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
                logger.error('Error actualizando metadata', metadataError, { id });
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
                logger.error('Error actualizando perfil', perfilError, { id });
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
                logger.error('Error actualizando usuarios_portal', portalError, { id });
                return NextResponse.json({ error: portalError.message }, { status: 500 });
            }
        }

        // Validar salida
        const responseData = { success: true, message: "Usuario actualizado correctamente" };
        const outputValidation = validateOutput(successResponseSchema, responseData);

        if (!outputValidation.success) {
            logger.error('Actualizar usuario: error validando salida', { error: outputValidation.error });
            return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
        }

        logger.info('Usuario actualizado exitosamente', { id });
        return NextResponse.json(outputValidation.data);

    } catch (error) {
        logger.error('Error actualizando usuario', error instanceof Error ? error : undefined);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado"
        }, { status: 500 });
    }
}

async function deleteUser(req: NextRequest) {
    try {
        const body = await req.json();

        // Validar entrada
        const validation = validateInput(deleteUserSchema, body);
        if (!validation.success) {
            logger.warn('Eliminar usuario: validación fallida', { error: validation.error });
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { id } = validation.data;

        logger.info('Eliminando usuario', { id });

        // 1. Eliminar de usuarios_portal
        const { error: portalError } = await supabaseAdmin
            .from("usuarios_portal")
            .delete()
            .eq("usuario_id", id);

        if (portalError) {
            logger.error('Error eliminando de usuarios_portal', portalError, { id });
            return NextResponse.json({ error: portalError.message }, { status: 500 });
        }

        // 2. Eliminar de perfiles_ciudadanos
        const { error: perfilError } = await supabaseAdmin
            .from("perfiles_ciudadanos")
            .delete()
            .eq("usuario_id", id);

        if (perfilError) {
            logger.warn('Error eliminando perfil (puede no existir)', { error: perfilError.message, id });
        }

        // 3. Eliminar usuario de auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            logger.error('Error eliminando usuario de auth', { error: authError.message, id });
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        // Validar salida
        const responseData = { success: true, message: "Usuario eliminado correctamente" };
        const outputValidation = validateOutput(successResponseSchema, responseData);

        if (!outputValidation.success) {
            logger.error('Eliminar usuario: error validando salida', { error: outputValidation.error });
            return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
        }

        logger.info('Usuario eliminado exitosamente', { id });
        return NextResponse.json(outputValidation.data);

    } catch (error) {
        logger.error('Error eliminando usuario', error instanceof Error ? error : undefined);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado"
        }, { status: 500 });
    }
}
