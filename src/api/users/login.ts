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

    // 2. Buscar usuario_id en perfiles_ciudadanos usando el email
    const { data: perfil, error: errorPerfil } = await supabase
        .from("perfiles_ciudadanos")
        .select("usuario_id")
        .eq("email", email)
        .maybeSingle();

    if (errorPerfil || !perfil?.usuario_id) {
        await supabase.auth.signOut();
        return { error: "Usuario no registrado en perfiles_ciudadanos." };
    }

    // 3. Validar usuario activo en usuarios_portal usando usuario_id
    const { data, error } = await supabase
        .from("usuarios_portal")
        .select("usuario_id, activo")
        .eq("usuario_id", perfil.usuario_id)
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

export async function logout() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Error signing out:', error.message);
        return { error: error.message };
    }

    console.log('User signed out successfully.');
    return { success: true };
}