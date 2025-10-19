import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const email = String(formData.get("email") ?? "").trim().toLowerCase();
        const password = String(formData.get("password") ?? "");

        const supabase = await createClient();

        // 1. Login normal
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 2. Buscar usuario_id en perfiles_ciudadanos usando el email
        const { data: perfil, error: errorPerfil } = await supabase
            .from("perfiles_ciudadanos")
            .select("usuario_id")
            .eq("email", email)
            .maybeSingle();

        if (errorPerfil || !perfil?.usuario_id) {
            await supabase.auth.signOut();
            return NextResponse.json({ error: "Usuario no registrado en perfiles_ciudadanos." }, { status: 400 });
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
            return NextResponse.json({ error: "Error al verificar el estado del usuario." }, { status: 400 });
        }

        if (!data) {
            await supabase.auth.signOut();
            return NextResponse.json({ error: "Usuario no registrado o deshabilitado en el portal." }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error durante login:', e);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}