// Forzamos el uso del runtime de Node.js para operaciones con service-role
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const CHILEAN_PHONE_REGEX = /^\+56\s?9\s?\d{4}\s?\d{4}$/;

export async function POST(req: NextRequest) {
    return registerStaff(req);
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Email es requerido" }, { status: 400 });

    const result = await getUserInfo(email);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
}

async function registerStaff(req: NextRequest) {
    const { email, password, name, last_name, phone, rol_id } = await req.json();

    if (!email || !password) {
        return NextResponse.json({ error: "Email y password requeridos" }, { status: 400 });
    }
    if (phone && !CHILEAN_PHONE_REGEX.test(phone)) {
        return NextResponse.json({ error: "El número de teléfono debe tener formato chileno: +56 9 XXXX XXXX" }, { status: 400 });
    }
    if (name == null || last_name == null) {
        return NextResponse.json({ error: "Nombre y apellido son requeridos" }, { status: 400 });
    }

    try {
        // 1) Crear usuario con service role (server-side)
        console.log("Intentando crear usuario con Supabase Admin...");
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: { name, last_name, phone: phone || "" },
            email_confirm: true
        });

        if (createErr) {
            console.error("Error creando usuario:", createErr);
            return NextResponse.json({ error: createErr.message }, { status: 500 });
        }

        if (!created?.user) {
            console.error("No se obtuvo información del usuario creado");
            return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
        }

        const usuario_id = created.user.id;
        console.log("Usuario creado correctamente:", usuario_id);

        // 2) Insertar en usuarios_portal con service role (evita problemas de permisos/RLS)
        let portalError;
        try {
            console.log("Insertando en usuarios_portal...");
            const result = await supabaseAdmin
                .from("usuarios_portal")
                .insert([{ usuario_id, rol_id, activo: true }]);

            portalError = result.error;

            if (portalError) {
                console.error("Error insertando en usuarios_portal:", portalError);
                console.log("Intentando método alternativo...");

                // Método alternativo usando createServerClient
                const supabaseServer = await createServerClient();
                const serverResult = await supabaseServer
                    .from("usuarios_portal")
                    .insert([{ usuario_id, rol_id, activo: true }]);

                if (serverResult.error) {
                    console.error("Error con método alternativo:", serverResult.error);
                    portalError = serverResult.error;
                } else {
                    console.log("Método alternativo exitoso");
                    portalError = null;
                }
            }
        } catch (insertError) {
            console.error("Excepción insertando en usuarios_portal:", insertError);
            portalError = { message: insertError instanceof Error ? insertError.message : String(insertError) };
        }

        if (portalError) {
            console.error("Error final insertando en usuarios_portal:", portalError);
            // rollback: borra el usuario recién creado
            try {
                await supabaseAdmin.auth.admin.deleteUser(usuario_id);
                console.log("Usuario eliminado en rollback");
            } catch (deleteError) {
                console.error("Error durante rollback:", deleteError);
            }
            return NextResponse.json({ error: portalError.message }, { status: 500 });
        }

        console.log("Usuario registrado completamente con éxito");
        return NextResponse.json({ user: created.user });

    } catch (error) {
        console.error("Excepción durante el proceso de registro:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Error inesperado conectando con Supabase"
        }, { status: 500 });
    }
}

// Si quieres mantener GET con sesión del usuario (no requiere service role)
async function getUserInfo(email: string) {
    const supabase = await createServerClient();

    const { data: perfil, error: errorPerfil } = await supabase
        .from("perfiles_ciudadanos")
        .select("usuario_id, nombre, apellido")
        .eq("email", email)
        .maybeSingle();

    if (errorPerfil) return { error: "Error al obtener perfil del usuario." };
    if (!perfil?.usuario_id) return { error: "No se encontró información del usuario." };

    const { data: usuario, error: errorUsuario } = await supabase
        .from("usuarios_portal")
        .select("rol_id")
        .eq("usuario_id", perfil.usuario_id)
        .maybeSingle();

    if (errorUsuario) return { error: "Error al obtener información del usuario." };
    if (!usuario) return { error: "No se encontró información del usuario." };

    const nombre = perfil.nombre ?? "";
    const apellido = perfil.apellido ?? "";
    return { role: usuario.rol_id, name: `${nombre} ${apellido}`.trim() };
}
