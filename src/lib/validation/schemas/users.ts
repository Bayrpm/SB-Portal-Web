/**
 * Esquemas de validación para endpoints de usuarios
 * Define input y output schemas para operaciones CRUD de usuarios del portal
 */

import { z } from 'zod';
import {
    uuidSchema,
    emailSchema,
    passwordSchema,
    nameSchema,
    chileanPhoneSchema,
    rolIdSchema
} from './common';

/**
 * Schema para crear un nuevo usuario (POST /api/users)
 */
export const createUserSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    last_name: nameSchema,
    phone: chileanPhoneSchema,
    rol_id: rolIdSchema
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schema para actualizar un usuario (PUT /api/users)
 */
export const updateUserSchema = z.object({
    id: uuidSchema,
    name: nameSchema.optional(),
    last_name: nameSchema.optional(),
    phone: chileanPhoneSchema,
    rol_id: rolIdSchema.optional(),
    activo: z.boolean().optional()
}).refine(
    (data) => {
        // Al menos un campo además de id debe estar presente
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = data;
        return Object.values(rest).some(val => val !== undefined);
    },
    { message: 'Debe proporcionar al menos un campo para actualizar' }
);

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Schema para eliminar un usuario (DELETE /api/users)
 */
export const deleteUserSchema = z.object({
    id: uuidSchema
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

/**
 * Schema para obtener usuario por email (GET /api/users?email=...)
 */
export const getUserByEmailSchema = z.object({
    email: emailSchema
});

export type GetUserByEmailInput = z.infer<typeof getUserByEmailSchema>;

/**
 * Schema para login (POST /api/users/login)
 * Acepta FormData con email y password
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, { message: 'La contraseña es requerida' })
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema de respuesta para operaciones de usuario
 */
export const userResponseSchema = z.object({
    user: z.object({
        id: uuidSchema,
        email: emailSchema,
        user_metadata: z.object({
            name: z.string().optional(),
            last_name: z.string().optional(),
            phone: z.string().optional()
        }).optional()
    }).optional(),
    success: z.boolean().optional()
});

export type UserResponse = z.infer<typeof userResponseSchema>;

/**
 * Schema de respuesta para getUserInfo
 */
export const userInfoResponseSchema = z.object({
    role: rolIdSchema,
    name: z.string()
});

export type UserInfoResponse = z.infer<typeof userInfoResponseSchema>;

/**
 * Schema de respuesta genérica de éxito
 */
export const successResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional()
});

export type SuccessResponse = z.infer<typeof successResponseSchema>;

/**
 * Schema de respuesta de error
 */
export const errorResponseSchema = z.object({
    error: z.string()
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
