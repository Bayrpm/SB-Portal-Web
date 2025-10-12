import { createClient } from "@/lib/supabase/client";

export async function getUserInfo(email: string) {
    const supabase = createClient();

    console.log("Obteniendo información del usuario con email:", email);

    const { data, error } = await supabase
        .from("usuarios_portal")
        .select("usuario_id, rol_id, nombre")
        .eq("email", email)
        .maybeSingle();

    console.log("Resultado consulta userInfo:", { data, error });

    if (error) {
        console.error("Error al obtener información del usuario:", error);
        return { error: "Error al obtener información del usuario." };
    }

    if (!data) {
        console.log("No se encontró información del usuario:", email);
        return { error: "No se encontró información del usuario." };
    }

    // Devolvemos el rol y nombre
    return {
        role: data.rol_id,
        name: data.nombre
    };
}