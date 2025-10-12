import { createClient } from "@/lib/supabase/client";

export async function login(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    // 1. Login normal
    const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        return { error: authError.message };
    }

    // 2. Validar usuario activo
    const { data, error } = await supabase
        .from("usuarios_portal")
        .select("usuario_id, email, activo")
        .eq("email", email)
        .eq("activo", true)
        .maybeSingle();

    if (error) {
        await supabase.auth.signOut();
        return { error: "Error al verificar el estado del usuario." };
    }

    if (!data) {
        await supabase.auth.signOut();
        return { error: "Usuario no registrado o deshabilitado en el portal." };
    }

    return { success: true };
}