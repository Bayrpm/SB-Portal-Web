/**
 * Formatea el nombre completo concatenando nombre y apellido.
 * 
 * @param nombre - El nombre de la persona
 * @param apellido - El apellido de la persona
 * @returns El nombre completo formateado, o una cadena vacía si ambos están vacíos
 */
export function formatFullName(nombre?: string | null, apellido?: string | null): string {
    return `${nombre || ''} ${apellido || ''}`.trim();
}
