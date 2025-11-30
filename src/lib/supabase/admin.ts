import { createClient } from "@supabase/supabase-js";

// Función para crear un cliente Supabase con manejo adecuado de errores
const createAdminClient = () => {
    // Verificamos si estamos en un entorno de desarrollo
    const isDev = process.env.NODE_ENV === 'development';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Validaciones de las variables de entorno
    if (!supabaseUrl) {
        const errorMsg = "ERROR: NEXT_PUBLIC_SUPABASE_URL no está definida en las variables de entorno";
        if (isDev) console.error(errorMsg);
        throw new Error("La URL de Supabase no está configurada");
    }

    if (!supabaseServiceKey) {
        const errorMsg = "ERROR: SUPABASE_SERVICE_ROLE_KEY no está definida en las variables de entorno";
        if (isDev) console.error(errorMsg);
        throw new Error("La clave de servicio de Supabase no está configurada");
    }

    // Solo mostrar logs en desarrollo
    if (isDev) {
        

        // Verificación adicional para depurar
        const JWT_REGEX = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        if (!JWT_REGEX.test(supabaseServiceKey)) {
            console.warn("⚠️ ADVERTENCIA: La clave de servicio no parece tener el formato JWT esperado (debe ser un JWT con tres partes separadas por puntos)");
        }
    }

    // Crear un cliente simplificado sin sobrescribir fetch
    return createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'x-application-name': 'sb-portal-admin'
                }
            }
        }
    );
};

export const supabaseAdmin = createAdminClient();
