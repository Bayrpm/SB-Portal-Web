import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const vista = searchParams.get("vista") || "sin_asignar";

        // Obtener denuncias según la vista (solo denuncias activas/pendientes)
        let query = supabase
            .from("denuncias")
            .select(`
        id,
        folio,
        titulo,
        fecha_creacion,
        ubicacion_texto,
        inspector_id,
        categoria_publica_id,
        prioridad_id
      `);

        // Filtrar según vista
        if (vista === "sin_asignar") {
            query = query.is("inspector_id", null);
        } else if (vista === "pendiente_acompanantes") {
            query = query.not("inspector_id", "is", null);
        }

        const { data: denuncias, error: denunciasError } = await query.order("fecha_creacion", { ascending: true });

        if (denunciasError) {
            return NextResponse.json({ error: denunciasError.message }, { status: 500 });
        }

        // Obtener IDs únicos
        const categoriaIds = Array.from(new Set(denuncias?.map((d) => d.categoria_publica_id) || []));
        const prioridadIds = Array.from(new Set(denuncias?.map((d) => d.prioridad_id).filter(Boolean) || []));

        // Obtener nombres de categorías
        const { data: categorias } = await supabase
            .from("categorias_publicas")
            .select("id, nombre")
            .in("id", categoriaIds);

        // Obtener nombres de prioridades
        const { data: prioridades } = await supabase
            .from("prioridades_denuncia")
            .select("id, nombre")
            .in("id", prioridadIds);

        // Mapear datos
        const categoriasMap = new Map(categorias?.map((c) => [c.id, c.nombre]) || []);
        const prioridadesMap = new Map(prioridades?.map((p) => [p.id, p.nombre]) || []);

        // Para cada denuncia, verificar si tiene acompañantes
        const denunciasConInfo = await Promise.all(
            (denuncias || []).map(async (denuncia) => {
                // Verificar acompañantes (asignaciones activas)
                const { data: asignaciones } = await supabase
                    .from("asignaciones_inspector")
                    .select("inspector_id")
                    .eq("denuncia_id", denuncia.id)
                    .is("fecha_termino", null);

                const tiene_acompanantes = (asignaciones?.length || 0) > (denuncia.inspector_id ? 1 : 0);

                // Calcular horas sin asignar
                const fechaCreacion = new Date(denuncia.fecha_creacion);
                const ahora = new Date();
                const horas_sin_asignar = Math.floor((ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60));

                return {
                    folio: denuncia.folio,
                    titulo: denuncia.titulo,
                    categoria: categoriasMap.get(denuncia.categoria_publica_id) || "Sin categoría",
                    prioridad: prioridadesMap.get(denuncia.prioridad_id) || "No asignada",
                    fecha_creacion: denuncia.fecha_creacion,
                    ubicacion_texto: denuncia.ubicacion_texto,
                    inspector_asignado: denuncia.inspector_id ? "Asignado" : null,
                    tiene_acompanantes,
                    horas_sin_asignar,
                };
            })
        );

        // Filtrar por acompañantes si es necesario
        let denunciasFiltradas = denunciasConInfo;
        if (vista === "pendiente_acompanantes") {
            denunciasFiltradas = denunciasConInfo.filter(d => !d.tiene_acompanantes);
        }

        // Calcular stats generales
        const { data: todasDenuncias } = await supabase
            .from("denuncias")
            .select("id, inspector_id, fecha_creacion");

        const sin_asignar = todasDenuncias?.filter(d => !d.inspector_id).length || 0;

        // Calcular denuncias con inspector pero sin acompañantes
        let pendiente_acompanantes = 0;
        const denunciasConInspector = todasDenuncias?.filter(d => d.inspector_id) || [];

        for (const d of denunciasConInspector) {
            const { data: asignaciones } = await supabase
                .from("asignaciones_inspector")
                .select("inspector_id")
                .eq("denuncia_id", d.id)
                .is("fecha_termino", null);

            // Si solo tiene 1 asignación (el inspector principal), entonces falta acompañante
            if ((asignaciones?.length || 0) === 1) {
                pendiente_acompanantes++;
            }
        }

        // Calcular denuncias con SLA vencido (más de 48 horas sin asignar)
        const vencidas_sla = denunciasFiltradas.filter(d => d.horas_sin_asignar > 48).length;

        return NextResponse.json({
            denuncias: denunciasFiltradas,
            stats: {
                sin_asignar,
                pendiente_acompanantes,
                vencidas_sla,
            },
        });
    } catch (error) {
        console.error("Error en GET /api/derivaciones:", error);
        return NextResponse.json({ error: "Error al obtener derivaciones" }, { status: 500 });
    }
}
