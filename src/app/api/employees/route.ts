import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = 'nodejs'; // Para acceder a metadatos de auth

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Primero obtenemos todos los usuarios registrados en usuarios_portal
        const { data: portalUsers, error: portalError } = await supabase
            .from("usuarios_portal")
            .select("usuario_id, rol_id, activo");

        if (portalError) {
            console.error("Error obteniendo usuarios del portal:", portalError);
            return NextResponse.json({ error: portalError.message }, { status: 500 });
        }

        console.log(`Encontrados ${portalUsers?.length || 0} usuarios en usuarios_portal`);

        if (!portalUsers || portalUsers.length === 0) {
            return NextResponse.json({ employees: [] });
        }

        const employees = [];

        for (const user of portalUsers) {
            try {
                // Intentamos obtener el perfil desde perfiles_ciudadanos
                const { data: profile } = await supabase
                    .from("perfiles_ciudadanos")
                    .select("nombre, apellido, email")
                    .eq("usuario_id", user.usuario_id)
                    .maybeSingle();

                if (profile) {
                    // Si encontramos perfil en perfiles_ciudadanos, lo usamos
                    employees.push({
                        id: user.usuario_id,
                        name: `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || 'Sin nombre',
                        email: profile.email || '',
                        rol_id: user.rol_id,
                        activo: user.activo
                    });
                } else {
                    // Si no hay perfil en perfiles_ciudadanos, obtenemos datos desde auth.users
                    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin
                        .getUserById(user.usuario_id);

                    if (authError) {
                        console.error(`Error obteniendo datos de auth para el usuario ${user.usuario_id}:`, authError);
                        continue;
                    }

                    if (authUser?.user) {
                        const metadata = authUser.user.user_metadata || {};
                        employees.push({
                            id: user.usuario_id,
                            name: `${metadata.name || ''} ${metadata.last_name || ''}`.trim() || 'Sin nombre',
                            email: authUser.user.email || '',
                            rol_id: user.rol_id,
                            activo: user.activo
                        });
                    }
                }
            } catch (userError) {
                console.error(`Error procesando usuario ${user.usuario_id}:`, userError);
                // Continuamos con el siguiente usuario
            }
        }

        console.log(`Enviando ${employees.length} empleados al frontend`);
        return NextResponse.json({ employees });
    } catch (error) {
        console.error("Error inesperado obteniendo funcionarios:", error);
        return NextResponse.json(
            { error: "Error al procesar la solicitud" },
            { status: 500 }
        );
    }
}