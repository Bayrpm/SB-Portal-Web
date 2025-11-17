/**
 * Esquemas de validación comunes reutilizables
 * Contiene validadores base para tipos frecuentes en el sistema
 */

import { z } from 'zod';

/**
 * UUID v4 válido
 */
export const uuidSchema = z.string().uuid({
    message: 'Debe ser un UUID válido'
});

/**
 * Email válido
 */
export const emailSchema = z.string()
    .email({ message: 'Debe ser un email válido' })
    .trim()
    .toLowerCase();

/**
 * Teléfono chileno: +56 9 XXXX XXXX
 */
export const chileanPhoneSchema = z.string()
    .regex(/^\+56\s?9\s?\d{4}\s?\d{4}$/, {
        message: 'El teléfono debe tener formato chileno: +56 9 XXXX XXXX'
    })
    .optional();

/**
 * Nombre de persona (no vacío, longitud razonable)
 */
export const nameSchema = z.string()
    .trim()
    .min(1, { message: 'El nombre no puede estar vacío' })
    .max(100, { message: 'El nombre es demasiado largo' });

/**
 * Password seguro (mínimo 6 caracteres)
 */
export const passwordSchema = z.string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' });

/**
 * Coordenadas geográficas (latitud)
 */
export const latitudeSchema = z.number()
    .min(-90, { message: 'Latitud debe estar entre -90 y 90' })
    .max(90, { message: 'Latitud debe estar entre -90 y 90' });

/**
 * Coordenadas geográficas (longitud)
 */
export const longitudeSchema = z.number()
    .min(-180, { message: 'Longitud debe estar entre -180 y 180' })
    .max(180, { message: 'Longitud debe estar entre -180 y 180' });

/**
 * Par de coordenadas
 */
export const coordinatesSchema = z.object({
    lat: latitudeSchema,
    lng: longitudeSchema
});

/**
 * Fecha ISO 8601
 */
export const isoDateSchema = z.string().datetime({
    message: 'Debe ser una fecha ISO 8601 válida'
});

/**
 * Boolean con coerción desde string
 */
export const booleanSchema = z.boolean()
    .or(z.string().transform(val => val === 'true'));

/**
 * ID numérico positivo
 */
export const positiveIdSchema = z.number()
    .int({ message: 'Debe ser un número entero' })
    .positive({ message: 'Debe ser un número positivo' });

/**
 * Página para paginación (default 1)
 */
export const pageSchema = z.coerce.number()
    .int()
    .positive()
    .default(1);

/**
 * Límite para paginación (default 20, máximo 100)
 */
export const limitSchema = z.coerce.number()
    .int()
    .positive()
    .max(100, { message: 'El límite máximo es 100' })
    .default(20);

/**
 * Texto no vacío
 */
export const nonEmptyStringSchema = z.string()
    .trim()
    .min(1, { message: 'Este campo no puede estar vacío' });

/**
 * Patente de vehículo chilena (formato: ABCD12 o AB1234)
 */
export const chileanPlateSchema = z.string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,4}\d{2,4}$/, {
        message: 'Formato de patente inválido'
    });

/**
 * Rol ID del sistema
 */
export const rolIdSchema = z.number()
    .int()
    .positive()
    .refine(val => [1, 2, 3].includes(val), {
        message: 'Rol ID debe ser 1 (Admin), 2 (Operador) o 3 (Inspector)'
    });
