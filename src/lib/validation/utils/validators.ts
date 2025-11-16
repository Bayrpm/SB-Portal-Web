/**
 * Utilidades de validación con Zod
 * Funciones helper para validar inputs/outputs y manejar errores
 */

import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Resultado de validación
 */
export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; details?: Record<string, string[]> };

/**
 * Valida datos de entrada con un schema Zod
 */
export function validateInput<T>(
    schema: ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    try {
        const parsed = schema.parse(data);
        return { success: true, data: parsed };
    } catch (error) {
        if (error instanceof ZodError) {
            const details: Record<string, string[]> = {};
            (error.issues as ZodIssue[]).forEach((err: ZodIssue) => {
                const path = err.path.join('.') || 'general';
                if (!details[path]) {
                    details[path] = [];
                }
                details[path].push(err.message);
            });

            const firstError = (error.issues as ZodIssue[])[0];
            const errorMessage = firstError
                ? `${firstError.path.join('.')}: ${firstError.message}`
                : 'Error de validación';

            logger.warn('Validación de entrada fallida', { details });

            return {
                success: false,
                error: errorMessage,
                details
            };
        }

        logger.error('Error inesperado durante validación', error instanceof Error ? error : undefined);
        return {
            success: false,
            error: 'Error inesperado durante validación'
        };
    }
}

/**
 * Valida datos de salida antes de enviar al cliente
 */
export function validateOutput<T>(
    schema: ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    try {
        const parsed = schema.parse(data);
        return { success: true, data: parsed };
    } catch (error) {
        if (error instanceof ZodError) {
            logger.error('Validación de salida fallida (posible bug en API)', error, {
                issues: error.issues
            });
        } else {
            logger.error('Error inesperado validando salida', error instanceof Error ? error : undefined);
        }

        return {
            success: false,
            error: 'Error interno del servidor al validar respuesta'
        };
    }
}

/**
 * Crea una respuesta de error formateada desde error de Zod
 */
export function createErrorResponse(
    error: string | ZodError,
    status: number = 400
): NextResponse {
    if (typeof error === 'string') {
        return NextResponse.json({ error }, { status });
    }

    const details: Record<string, string[]> = {};
    (error.issues as ZodIssue[]).forEach((err: ZodIssue) => {
        const path = err.path.join('.') || 'general';
        if (!details[path]) {
            details[path] = [];
        }
        details[path].push(err.message);
    });

    const firstError = (error.issues as ZodIssue[])[0];
    const message = firstError
        ? `${firstError.path.join('.')}: ${firstError.message}`
        : 'Error de validación';

    return NextResponse.json(
        {
            error: message,
            details
        },
        { status }
    );
}

/**
 * Detecta y maneja errores de duplicado de PostgreSQL (código 23505)
 */
export function handleDuplicateError(
    error: unknown,
    customMessage?: string
): NextResponse | null {
    if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
    ) {
        const message = customMessage || 'El registro ya existe en la base de datos';
        logger.warn('Intento de crear registro duplicado', { error });
        return NextResponse.json({ error: message }, { status: 409 });
    }
    return null;
}

/**
 * Normaliza coordenadas geográficas para Chile
 * Reutiliza lógica existente de validación de coordenadas
 */
export function normalizeCoordinates(lat: number, lng: number): {
    lat: number;
    lng: number;
    valid: boolean;
    warning?: string;
} {
    let normalizedLat = lat;
    let normalizedLng = lng;
    let warning: string | undefined;

    // Detectar si están invertidas (lng, lat en vez de lat, lng)
    if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
        normalizedLat = lng;
        normalizedLng = lat;
        warning = 'Coordenadas invertidas, se corrigieron automáticamente';
    }

    // Validar rango Chile continental
    const isInChile =
        normalizedLat >= -56 && normalizedLat <= -17 &&
        normalizedLng >= -76 && normalizedLng <= -66;

    if (!isInChile) {
        return { lat: normalizedLat, lng: normalizedLng, valid: false };
    }

    // Validar rango aproximado San Bernardo
    const isInSanBernardo =
        normalizedLat >= -33.75 && normalizedLat <= -33.55 &&
        normalizedLng >= -70.75 && normalizedLng <= -70.60;

    if (!isInSanBernardo && !warning) {
        warning = 'Las coordenadas están fuera del rango típico de San Bernardo';
    }

    return {
        lat: normalizedLat,
        lng: normalizedLng,
        valid: true,
        warning
    };
}

/**
 * Extrae datos de FormData y los convierte a objeto plano
 */
export function formDataToObject(formData: FormData): Record<string, string> {
    const obj: Record<string, string> = {};
    formData.forEach((value, key) => {
        obj[key] = String(value).trim();
    });
    return obj;
}

/**
 * Parsea query params de URL a objeto
 */
export function parseQueryParams(url: string): Record<string, string> {
    const searchParams = new URL(url).searchParams;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
