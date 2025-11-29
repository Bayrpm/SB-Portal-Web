import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPageAccess } from "@/lib/security/checkPageAccess";

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

        // Verificar que el usuario tenga acceso a /portal/auditoria
        const hasAccess = await checkPageAccess(supabase, user.id, "/portal/auditoria");

        if (!hasAccess) {
            return NextResponse.json(
                { error: "No autorizado para acceder a esta funcionalidad" },
                { status: 403 }
            );
        }

        // Obtener parámetros de consulta
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");
        const tablasParam = searchParams.get("tablas") || ""; // Tablas separadas por coma
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
        if (tablasParam) {
            const tablasArray = tablasParam.split(",").map(t => t.trim()).filter(t => t);
            if (tablasArray.length > 0) {
                query = query.in("tabla", tablasArray);
            }
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

        return NextResponse.json({
            registros: registros || [],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error("Error inesperado:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
