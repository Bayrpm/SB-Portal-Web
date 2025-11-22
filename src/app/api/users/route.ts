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

        // 0. Verificar referencias en otras tablas antes de eliminar
        const referencesCheck = await checkUserReferences(id);
        if (referencesCheck.hasReferences) {
            const message = `Este usuario no puede ser eliminado porque cuenta con registros en: ${referencesCheck.references.join(", ")}`;
            logger.warn('Usuario tiene referencias activas', { id, references: referencesCheck.references });
            return NextResponse.json({ error: message }, { status: 400 });
        }

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
            // Si hay error en auth, buscar TODAS las referencias posibles como fallback
            logger.warn('Error en auth, verificando referencias exhaustivamente', { error: authError.message, id });
            const detailedReferences = await checkUserReferencesDetailed(id);

            if (detailedReferences.hasReferences) {
                const message = `Este usuario no puede ser eliminado porque cuenta con registros activos en: ${detailedReferences.references.join(", ")}. Por favor, elimine o reasigne estos registros primero.`;
                logger.warn('Usuario tiene referencias que impiden eliminación', { id, references: detailedReferences.references });
                return NextResponse.json({ error: message }, { status: 400 });
            }

            // Si no hay referencias encontradas pero sigue habiendo error, probablemente sea un sesión activa
            logger.error('Error eliminando usuario de auth sin referencias detectadas', { error: authError.message, id });
            return NextResponse.json({
                error: `No se puede eliminar el usuario. El usuario podría tener sesiones activas. Intente nuevamente o contacte al administrador. Error: ${authError.message}`
            }, { status: 500 });
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

/**
 * Verifica si el usuario tiene referencias activas en otras tablas
 * Retorna información sobre dónde tiene registros
 */
async function checkUserReferences(userId: string): Promise<{ hasReferences: boolean; references: string[] }> {
    const references: string[] = [];

    try {
        // Verificar en denuncias (como ciudadano)
        const { count: denunciasCiudadano } = await supabaseAdmin
            .from("denuncias")
            .select("*", { count: "exact", head: true })
            .eq("ciudadano_id", userId);

        if (denunciasCiudadano && denunciasCiudadano > 0) {
            references.push(`Denuncias creadas (${denunciasCiudadano})`);
        }

        // Verificar en inspectores
        const { count: inspectores } = await supabaseAdmin
            .from("inspectores")
            .select("*", { count: "exact", head: true })
            .eq("usuario_id", userId);

        if (inspectores && inspectores > 0) {
            references.push(`Perfil de Inspector`);
        }

        // Verificar en asignaciones_inspector (asignador)
        const { count: asignacionesAsignador } = await supabaseAdmin
            .from("asignaciones_inspector")
            .select("*", { count: "exact", head: true })
            .eq("asignado_por", userId);

        if (asignacionesAsignador && asignacionesAsignador > 0) {
            references.push(`Asignaciones realizadas (${asignacionesAsignador})`);
        }

        // Verificar en denuncias (como inspector asignado)
        const { data: denunciasPorInspector } = await supabaseAdmin
            .from("denuncias")
            .select("id", { count: "exact" })
            .eq("inspector_id", userId);

        if (denunciasPorInspector && denunciasPorInspector.length > 0) {
            references.push(`Denuncias asignadas como inspector (${denunciasPorInspector.length})`);
        }

        // Verificar en denuncia_historial (como actor)
        const { count: historialActor } = await supabaseAdmin
            .from("denuncia_historial")
            .select("*", { count: "exact", head: true })
            .eq("actor_usuario_id", userId);

        if (historialActor && historialActor > 0) {
            references.push(`Eventos en historial de denuncias (${historialActor})`);
        }

        // Verificar en denuncia_observaciones (creadas por)
        const { count: observacionesCreadas } = await supabaseAdmin
            .from("denuncia_observaciones")
            .select("*", { count: "exact", head: true })
            .eq("creado_por", userId);

        if (observacionesCreadas && observacionesCreadas > 0) {
            references.push(`Observaciones creadas (${observacionesCreadas})`);
        }

        // Verificar en denuncia_clasificaciones (clasificadas por)
        const { count: clasificaciones } = await supabaseAdmin
            .from("denuncia_clasificaciones")
            .select("*", { count: "exact", head: true })
            .eq("clasificado_por", userId);

        if (clasificaciones && clasificaciones > 0) {
            references.push(`Denuncias clasificadas (${clasificaciones})`);
        }

        // Verificar en comentarios_denuncias
        const { count: comentarios } = await supabaseAdmin
            .from("comentarios_denuncias")
            .select("*", { count: "exact", head: true })
            .eq("usuario_id", userId);

        if (comentarios && comentarios > 0) {
            references.push(`Comentarios creados (${comentarios})`);
        }

        // Verificar en turnos (como inspector)
        const { count: turnos } = await supabaseAdmin
            .from("turnos")
            .select("*", { count: "exact", head: true })
            .eq("inspector_id", userId);

        if (turnos && turnos > 0) {
            references.push(`Turnos registrados (${turnos})`);
        }

        // Verificar en movil_usos
        const { count: movilUsos } = await supabaseAdmin
            .from("movil_usos")
            .select("*", { count: "exact", head: true })
            .eq("inspector_id", userId);

        if (movilUsos && movilUsos > 0) {
            references.push(`Usos de móviles (${movilUsos})`);
        }

        logger.debug('Referencias del usuario verificadas', { userId, references });

        return {
            hasReferences: references.length > 0,
            references
        };

    } catch (error) {
        logger.error('Error verificando referencias del usuario', error instanceof Error ? error : undefined, { userId });
        // En caso de error, permitir el intento de eliminación (el error específico saldrá después)
        return { hasReferences: false, references: [] };
    }
}

/**
 * Búsqueda exhaustiva de referencias cuando hay error de eliminación
 * Verifica todas las tablas posibles incluyendo las que podrían no existir
 */
async function checkUserReferencesDetailed(userId: string): Promise<{ hasReferences: boolean; references: string[] }> {
    const references: string[] = [];

    // Lista de todas las tablas y columnas a verificar
    const tablesToCheck: Array<{ table: string; column: string; label: string }> = [
        { table: "denuncias", column: "ciudadano_id", label: "Denuncias (como ciudadano)" },
        { table: "denuncias", column: "inspector_id", label: "Denuncias (como inspector)" },
        { table: "inspectores", column: "usuario_id", label: "Inspectores" },
        { table: "asignaciones_inspector", column: "asignado_por", label: "Asignaciones realizadas" },
        { table: "asignaciones_inspector", column: "inspector_id", label: "Asignaciones como inspector" },
        { table: "denuncia_historial", column: "actor_usuario_id", label: "Historial de denuncias" },
        { table: "denuncia_observaciones", column: "creado_por", label: "Observaciones creadas" },
        { table: "denuncia_clasificaciones", column: "clasificado_por", label: "Clasificaciones realizadas" },
        { table: "comentarios_denuncias", column: "usuario_id", label: "Comentarios" },
        { table: "comentario_reacciones", column: "usuario_id", label: "Reacciones a comentarios" },
        { table: "denuncia_reacciones", column: "usuario_id", label: "Reacciones a denuncias" },
        { table: "turnos", column: "inspector_id", label: "Turnos" },
        { table: "turnos_planificados", column: "inspector_id", label: "Turnos planificados" },
        { table: "movil_usos", column: "inspector_id", label: "Usos de móviles" },
        { table: "movil_usos", column: "actor_user_id", label: "Registros de móviles" },
        { table: "movil_uso_kilometraje", column: "actor_user_id", label: "Registros de kilometraje" },
        { table: "eventos_turno", column: "actor_user_id", label: "Eventos de turno" },
        { table: "push_status_queue", column: "user_id", label: "Notificaciones en cola" },
        { table: "notificaciones_enviadas", column: "usuario_id", label: "Notificaciones enviadas" },
        { table: "alertas_oficiales", column: "creado_por", label: "Alertas creadas" },
        // NOTA: audit_log NO tiene FK constraint, solo registra auditoría histórica
        // No impide eliminación del usuario
    ];

    for (const item of tablesToCheck) {
        try {
            const { count } = await supabaseAdmin
                .from(item.table)
                .select("*", { count: "exact", head: true })
                .eq(item.column, userId);

            if (count && count > 0) {
                references.push(`${item.label} (${count})`);
                logger.debug('Referencia encontrada', { table: item.table, column: item.column, count, userId });
            }
        } catch {
            // La tabla podría no existir, continuamos con la siguiente
            logger.debug('Tabla no verificable', { table: item.table, column: item.column });
        }
    }

    logger.debug('Búsqueda exhaustiva completada', { userId, referencesFound: references.length });

    return {
        hasReferences: references.length > 0,
        references
    };
}
