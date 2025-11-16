import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    loginSchema,
    successResponseSchema,
    validateInput,
    validateOutput,
    formDataToObject,
    rateLimit,
    rateLimitPresets,
    logger
} from '@/lib/validation';

export async function POST(req: NextRequest) {
    // Aplicar rate limiting (5 intentos por minuto)
    const rateLimitResponse = await rateLimit(req, rateLimitPresets.login);
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    try {
        const formData = await req.formData();
        const inputData = formDataToObject(formData);

        // Validar entrada
        const validation = validateInput(loginSchema, inputData);
        if (!validation.success) {
            logger.warn('Login: validación fallida', { error: validation.error });
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const { email, password } = validation.data;

        const supabase = await createClient();

        // 1. Login normal
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            logger.warn('Login fallido: credenciales inválidas', { email });
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 2. Buscar usuario_id en perfiles_ciudadanos usando el email
        const { data: perfil, error: errorPerfil } = await supabase
            .from("perfiles_ciudadanos")
            .select("usuario_id")
            .eq("email", email)
            .maybeSingle();

        if (errorPerfil || !perfil?.usuario_id) {
            await supabase.auth.signOut();
            logger.warn('Login fallido: usuario sin perfil', { email });
            return NextResponse.json({ error: "Usuario no registrado en perfiles_ciudadanos." }, { status: 400 });
        }

        // 3. Validar usuario activo en usuarios_portal usando usuario_id
        const { data, error } = await supabase
            .from("usuarios_portal")
            .select("usuario_id, activo")
            .eq("usuario_id", perfil.usuario_id)
            .eq("activo", true)
            .maybeSingle();

        if (error) {
            await supabase.auth.signOut();
            logger.error('Login fallido: error verificando portal', error, { email });
            return NextResponse.json({ error: "Error al verificar el estado del usuario." }, { status: 400 });
        }

        if (!data) {
            await supabase.auth.signOut();
            logger.warn('Login fallido: usuario no en portal o inactivo', { email });
            return NextResponse.json({ error: "Usuario no registrado o deshabilitado en el portal." }, { status: 400 });
        }

        // Validar respuesta de salida
        const responseData = { success: true };
        const outputValidation = validateOutput(successResponseSchema, responseData);

        if (!outputValidation.success) {
            logger.error('Login: error validando salida', { error: outputValidation.error });
            return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
        }

        logger.info('Login exitoso', { email, userId: perfil.usuario_id });
        return NextResponse.json(outputValidation.data);
    } catch (e) {
        logger.error('Error interno durante login', e instanceof Error ? e : undefined);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}