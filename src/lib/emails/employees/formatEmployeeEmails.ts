// /lib/emails/formatEmails.ts
import type { SupabaseClient } from "@supabase/supabase-js";

const DOMAIN = "sanbernardo.gob.cl";

// Partículas comunes que solemos omitir en el username
const PARTICULAS = new Set([
    "de", "del", "la", "las", "los", "y", "da", "do", "das", "dos",
]);

function stripDiacritics(input: string): string {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function toAsciiLower(input: string): string {
    return stripDiacritics(input).toLowerCase();
}
function sanitizeUsernamePart(input: string): string {
    return input.replace(/[^a-z0-9]/g, "");
}

function getNameLetters(nombre: string, letters: number): string {
    const firstWord =
        toAsciiLower(nombre).split(/\s+/).filter(Boolean)[0] ?? "";
    return sanitizeUsernamePart(firstWord.slice(0, Math.max(0, letters)));
}

function getLastnamesBlock(apellido: string): string {
    const words = toAsciiLower(apellido)
        .split(/\s+/)
        .filter(Boolean)
        .filter((w) => !PARTICULAS.has(w));
    return sanitizeUsernamePart(words.join(""));
}

function buildEmail(localPart: string): string {
    return `${localPart}@${DOMAIN}`;
}

/** Genera el local-part con N letras del nombre + todo el apellido */
function makeLocalPart(nombre: string, apellido: string, letters: number) {
    const first = getNameLetters(nombre, letters);
    const last = getLastnamesBlock(apellido);
    // fallbacks defensivos
    if (!first && !last) return "";
    return `${first}${last}`;
}

/** Formato básico (1 letra por defecto) */
export function formatEmail(nombre: string, apellido: string, letters = 1) {
    const local = makeLocalPart(nombre, apellido, letters);
    return local ? buildEmail(local) : "";
}

/** Chequea existencia en Supabase (tabla/columna configurables) */
export async function emailExists(
    supabase: SupabaseClient,
    email: string,
    options?: { table?: string; column?: string }
): Promise<boolean> {
    const table = options?.table ?? "perfiles_ciudadanos";
    const column = options?.column ?? "email";
    const { data, error } = await supabase
        .from(table)
        .select(column)
        .eq(column, email)
        .limit(1);
    if (error) {
        // Puedes loguear el error si quieres
        throw error;
    }
    return Array.isArray(data) && data.length > 0;
}

/**
 * Genera un email único respetando tu regla:
 * 1) 1 inicial + apellido
 * 2) si existe → 2 letras + apellido
 * 3) (opcional) si también existe → sufijos numéricos (2..99)
 */
export async function generateEmployeeEmailWithSupabase(
    supabase: SupabaseClient,
    nombre: string,
    apellido: string,
    options?: {
        table?: string;   // default: 'usuarios'
        column?: string;  // default: 'email'
        allowNumericFallback?: boolean; // default: true
    }
): Promise<string> {
    const table = options?.table;
    const column = options?.column;
    const allowNumeric = options?.allowNumericFallback ?? true;

    // 1) 1 inicial
    const email1 = formatEmail(nombre, apellido, 1);
    if (email1 && !(await emailExists(supabase, email1, { table, column }))) {
        return email1;
    }

    // 2) 2 letras
    const local2 = makeLocalPart(nombre, apellido, 2);
    if (!local2) return email1; // no pudimos construir algo mejor
    const email2 = buildEmail(local2);
    if (!(await emailExists(supabase, email2, { table, column }))) {
        return email2;
    }

    // 3) (opcional) sufijos numéricos
    if (allowNumeric) {
        for (let i = 2; i < 100; i++) {
            const candidate = buildEmail(`${local2}${i}`);
            if (!(await emailExists(supabase, candidate, { table, column }))) {
                return candidate;
            }
        }
    }

    // Si no encontramos disponible, devuelve el 2 letras (aunque exista) o lanza error
    throw new Error("No se pudo generar un email único");
    return email2;
}
