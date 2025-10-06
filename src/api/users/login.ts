import { createClient } from "@/lib/supabase/client";

export async function login(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    console.log("Iniciando login para email:", email);

    // 1. Login normal
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    console.log("Resultado auth:", {
        authOk: !authError,
        authError: authError?.message,
        user: authData?.user?.email
    });

    if (authError) {
        return { error: authError.message };
    }

    // 2. Consulta el rol del usuario
    const { data, error } = await supabase
        .from("usuarios_portal")
        .select("usuario_id, email, activo, rol_id")
        .eq("email", email)
        .eq("activo", true)
        .maybeSingle();

    console.log("Resultado consulta usuario:", {
        data,
        error,
        consultaEmail: email
    });

    if (error) {
        console.log("Error en consulta:", error);
        await supabase.auth.signOut();
        return { error: "Error al verificar el estado del usuario." };
    }

    if (!data) {
        console.log("No se encontró usuario activo con el email:", email);
        await supabase.auth.signOut();
        return { error: "Usuario no registrado o deshabilitado en el portal." };
    }

    // OK: sesión válida + usuario activo en usuarios_portal
    console.log("Login exitoso para:", email, "Rol:", data.rol_id);
    return { success: true, role: data.rol_id };
}