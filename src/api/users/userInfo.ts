import { createClient } from "@/lib/supabase/client";

export async function getUserInfo(email: string) {
    const supabase = createClient();

    // 1. Buscar usuario_id en perfiles_ciudadanos usando el email
    const { data: perfil, error: errorPerfil } = await supabase
        .from("perfiles_ciudadanos")
        .select("usuario_id, nombre, apellido")
        .eq("email", email)
        .maybeSingle();

    if (errorPerfil) {
        return { error: "Error al obtener perfil del usuario." };
    }
    if (!perfil?.usuario_id) {
        return { error: "No se encontró información del usuario." };
    }

    // 2. Buscar rol en usuarios_portal usando usuario_id
    const { data: usuario, error: errorUsuario } = await supabase
        .from("usuarios_portal")
        .select("rol_id")
        .eq("usuario_id", perfil.usuario_id)
        .maybeSingle();

    if (errorUsuario) {
        return { error: "Error al obtener información del usuario." };
    }
    if (!usuario) {
        return { error: "No se encontró información del usuario." };
    }

    const nombre = perfil.nombre ?? "";
    const apellido = perfil.apellido ?? "";
    const nombreCompleto = `${nombre} ${apellido}`.trim();

    return {
        role: usuario.rol_id,
        name: nombreCompleto || null
    };
}