import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticación
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "No autenticado" },
                { status: 401 }
            );
        }

        // Verificar que sea usuario del portal
        const { data: portalUser, error: portalError } = await supabase
            .from("usuarios_portal")
            .select("rol_id, activo")
            .eq("usuario_id", user.id)
            .single();

        if (portalError || !portalUser || !portalUser.activo) {
            return NextResponse.json(
                { error: "Acceso denegado" },
                { status: 403 }
            );
        }

        // Verificar que sea administrador (rol_id = 1)
        if (portalUser.rol_id !== 1) {
            return NextResponse.json(
                { error: "Solo administradores pueden acceder a auditoría" },
                { status: 403 }
            );
        }

        // Obtener parámetros de consulta
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");
        const tabla = searchParams.get("tabla") || "";
        const operacion = searchParams.get("operacion") || "";
        const actorEmail = searchParams.get("actorEmail") || "";
        const fechaDesde = searchParams.get("fechaDesde") || "";
        const fechaHasta = searchParams.get("fechaHasta") || "";

        // Construir query
        let query = supabase
            .from("audit_log")
            .select("*", { count: "exact" })
            .order("ts", { ascending: false });

        // Aplicar filtros
        if (tabla) {
            query = query.eq("tabla", tabla);
        }

        if (operacion) {
            query = query.eq("operacion", operacion);
        }

        if (actorEmail) {
            query = query.ilike("actor_email", `%${actorEmail}%`);
        }

        if (fechaDesde) {
            query = query.gte("ts", fechaDesde);
        }

        if (fechaHasta) {
            // Agregar 1 día para incluir todo el día seleccionado
            const fechaHastaFin = new Date(fechaHasta);
            fechaHastaFin.setDate(fechaHastaFin.getDate() + 1);
            query = query.lt("ts", fechaHastaFin.toISOString());
        }

        // Aplicar paginación
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data: registros, error, count } = await query;

        if (error) {
            console.error("Error al obtener auditoría:", error);
            return NextResponse.json(
                { error: "Error al obtener registros de auditoría" },
                { status: 500 }
            );
        }

        // Obtener nombres de usuarios desde perfiles_ciudadanos
        const usuariosIds = [...new Set(
            (registros || [])
                .map((r: { actor_user_id: string | null }) => r.actor_user_id)
                .filter((id: string | null) => id !== null)
        )] as string[];

        let usuariosMap = new Map<string, string>();

        if (usuariosIds.length > 0) {
            const { data: perfiles } = await supabase
                .from("perfiles_ciudadanos")
                .select("usuario_id, nombre, apellido")
                .in("usuario_id", usuariosIds);

            if (perfiles) {
                usuariosMap = new Map(
                    perfiles.map((p: { usuario_id: string; nombre: string; apellido: string }) => [
                        p.usuario_id,
                        `${p.nombre} ${p.apellido}`.trim(),
                    ])
                );
            }
        }

        // Agregar nombre al registro
        const registrosConNombre = (registros || []).map((r: {
            actor_user_id: string;
            actor_email: string;
            [key: string]: unknown;
        }) => ({
            ...r,
            actor_nombre: usuariosMap.get(r.actor_user_id) || r.actor_email || "Desconocido",
        }));

        // Obtener lista de tablas únicas (para filtro)
        const { data: tablas } = await supabase
            .from("audit_log")
            .select("tabla")
            .order("tabla");

        const tablasUnicas = tablas
            ? [...new Set(tablas.map((t) => t.tabla))].sort()
            : [];

        return NextResponse.json({
            registros: registrosConNombre,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
            tablas: tablasUnicas,
        });
    } catch (error) {
        console.error("Error inesperado:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
