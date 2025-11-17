/**
 * Middleware de autenticación básico
 * Valida sesión activa y usuario del portal (sin validación de roles por ahora)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '../utils/logger';
import type { User } from '@supabase/supabase-js';

/**
 * Error de autenticación
 */
export class AuthError extends Error {
    constructor(
        message: string,
        public statusCode: number = 401
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

/**
 * Información de usuario autenticado
 */
export interface AuthenticatedUser {
    user: User;
    usuario_id: string;
    activo: boolean;
}

/**
 * Valida que haya una sesión activa en Supabase
 * @throws AuthError si no hay sesión o es inválida
 */
export async function validateAuth(): Promise<User> {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        logger.warn('Intento de acceso sin autenticación', { error: error?.message });
        throw new AuthError('No autenticado. Por favor inicia sesión.', 401);
    }

    return user;
}

/**
 * Valida que el usuario esté registrado y activo en usuarios_portal
 * @throws AuthError si el usuario no está en el portal o está inactivo
 */
export async function validatePortalUser(user: User): Promise<AuthenticatedUser> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('usuarios_portal')
        .select('usuario_id, activo')
        .eq('usuario_id', user.id)
        .single();

    if (error || !data) {
        logger.warn('Usuario autenticado pero no en portal', {
            userId: user.id,
            email: user.email
        });
        throw new AuthError('Usuario no registrado en el portal.', 403);
    }

    if (!data.activo) {
        logger.warn('Usuario inactivo intentó acceder', {
            userId: user.id,
            email: user.email
        });
        throw new AuthError('Usuario deshabilitado. Contacta al administrador.', 403);
    }

    return {
        user,
        usuario_id: data.usuario_id,
        activo: data.activo
    };
}

/**
 * Tipo de handler de ruta autenticado
 */
type AuthenticatedHandler = (
    req: NextRequest,
    context: { user: AuthenticatedUser }
) => Promise<NextResponse>;

/**
 * HOC que envuelve un handler de ruta con validación de autenticación
 * Uso: export const POST = withAuth(async (req, { user }) => { ... });
 */
export function withAuth(handler: AuthenticatedHandler) {
    return async (req: NextRequest): Promise<NextResponse> => {
        try {
            // Validar sesión
            const user = await validateAuth();

            // Validar usuario del portal
            const authenticatedUser = await validatePortalUser(user);

            // Ejecutar handler con usuario autenticado
            return await handler(req, { user: authenticatedUser });

        } catch (error) {
            if (error instanceof AuthError) {
                return NextResponse.json(
                    { error: error.message },
                    { status: error.statusCode }
                );
            }

            logger.error('Error inesperado en middleware de autenticación', error instanceof Error ? error : undefined);

            return NextResponse.json(
                { error: 'Error interno del servidor' },
                { status: 500 }
            );
        }
    };
}

/**
 * Extrae información del usuario de la request (si existe)
 * Útil para logging y auditoría
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserFromRequest(_req: NextRequest): Promise<User | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch {
        return null;
    }
}
