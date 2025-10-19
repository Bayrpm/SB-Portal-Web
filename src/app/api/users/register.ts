import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CHILEAN_PHONE_REGEX = /^\+56\s?9\s?\d{4}\s?\d{4}$/;

export async function registerStaff(req: NextRequest) {
    const supabase = createClient();
    const { email, password, name, last_name, phone, rol_id } = await req.json();

    if (!email || !password) {
        return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 });
    }

    // Validación de formato de teléfono chileno si se proporciona
    if (phone && !CHILEAN_PHONE_REGEX.test(phone)) {
        return NextResponse.json({
            error: 'El número de teléfono debe tener formato chileno: +56 9 XXXX XXXX'
        }, { status: 400 });
    }

    if (name == null || last_name == null) {
        return NextResponse.json({
            error: 'Nombre y apellido son requeridos'
        }, { status: 400 });
    }

    const { data, error } = await (await supabase).auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name || '',
                last_name: last_name || '',
                phone: phone || ''
            }
        }
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const usuario_id = data?.user?.id;
    if (!usuario_id) {
        return NextResponse.json({ error: 'No se pudo obtener el usuario_id.' }, { status: 500 });
    }

    const { error: portalError } = await (await supabase)
        .from('usuarios_portal')
        .insert([
            {
                usuario_id,
                rol_id,
                activo: true // Por defecto el usuario queda activo
            }
        ]);

    if (portalError) {
        return NextResponse.json({ error: portalError.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user });
}