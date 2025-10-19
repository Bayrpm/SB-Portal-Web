import { createClient } from "@supabase/supabase-js";

// Función para crear un cliente Supabase con reintentos
function createAdminClientWithRetries(retries = 3, timeout = 15000) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL no está definida en las variables de entorno");
        throw new Error("La URL de Supabase no está configurada");
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY no está definida en las variables de entorno");
        throw new Error("La clave de servicio de Supabase no está configurada");
    }

    console.log("Creando cliente Supabase Admin");

    // Verificación adicional para depurar
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
        console.warn("⚠️ ADVERTENCIA: La clave de servicio no parece tener el formato JWT esperado (debe comenzar con 'eyJ')");
    }

    // Crear un cliente simplificado sin sobrescribir fetch para evitar problemas con los headers
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
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
}

export const supabaseAdmin = createAdminClientWithRetries();
