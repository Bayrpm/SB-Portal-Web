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

        // 1. Batch fetch all profiles for portal users
        const usuarioIds = portalUsers.map(u => u.usuario_id);
        const { data: perfilesCiudadanos, error: perfilesError } = await supabase
            .from("perfiles_ciudadanos")
            .select("usuario_id, nombre, apellido, email")
            .in("usuario_id", usuarioIds);

        if (perfilesError) {
            console.error("Error obteniendo perfiles_ciudadanos:", perfilesError);
            return NextResponse.json({ error: perfilesError.message }, { status: 500 });
        }

        // Map usuario_id to profile
        const perfilesMap = new Map();
        for (const perfil of perfilesCiudadanos || []) {
            perfilesMap.set(perfil.usuario_id, perfil);
        }

        // Find usuario_ids missing a profile
        const missingProfileIds = portalUsers
            .filter(u => !perfilesMap.has(u.usuario_id))
            .map(u => u.usuario_id);

        // Batch fetch auth users for missing profiles
        let authUsersMap = new Map();
        if (missingProfileIds.length > 0) {
            // Supabase Admin API does not support filtering by IDs, so we fetch all users and filter in-memory
            // If user base is large, consider paginating or chunking
            const { data: allAuthUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
            if (authListError) {
                console.error("Error obteniendo usuarios de auth:", authListError);
                return NextResponse.json({ error: authListError.message }, { status: 500 });
            }
            for (const user of allAuthUsers.users || []) {
                if (missingProfileIds.includes(user.id)) {
                    authUsersMap.set(user.id, user);
                }
            }
        }

        // Build employees array
        const employees = [];
        for (const user of portalUsers) {
            const perfil = perfilesMap.get(user.usuario_id);
            if (perfil) {
                employees.push({
                    id: user.usuario_id,
                    name: `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() || 'Sin nombre',
                    email: perfil.email || '',
                    rol_id: user.rol_id,
                    activo: user.activo
                });
            } else {
                const authUser = authUsersMap.get(user.usuario_id);
                if (authUser) {
                    const metadata = authUser.user_metadata || {};
                    employees.push({
                        id: user.usuario_id,
                        name: `${metadata.name || ''} ${metadata.last_name || ''}`.trim() || 'Sin nombre',
                        email: authUser.email || '',
                        rol_id: user.rol_id,
                        activo: user.activo
                    });
                } else {
                    // No profile or auth user found, skip or add minimal info
                    employees.push({
                        id: user.usuario_id,
                        name: 'Sin nombre',
                        email: '',
                        rol_id: user.rol_id,
                        activo: user.activo
                    });
                }
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