import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/validation/utils/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const vista = searchParams.get("vista") || "sin_asignar";

        // Obtener datos de la vista materializada
        const { data: todasLasDerivas, error: derivasError } = await supabase
            .from("derivaciones_vista")
            .select(`
                folio,
                titulo,
                categoria,
                prioridad,
                fecha_creacion,
                ubicacion_texto,
                inspector_asignado,
                tiene_acompanantes,
                horas_sin_asignar,
                vencida_sla,
                estado_asignacion
            `)
            .order("fecha_creacion", { ascending: true });

        if (derivasError) {
            logger.error("Error consultando vista derivaciones", { error: derivasError.message });
            return NextResponse.json({ error: derivasError.message }, { status: 500 });
        }

        // Filtrar según vista
        let denunciasFiltradas = todasLasDerivas || [];

        if (vista === "sin_asignar") {
            denunciasFiltradas = denunciasFiltradas.filter(d => d.estado_asignacion === "sin_asignar");
        } else if (vista === "pendiente_acompanantes") {
            denunciasFiltradas = denunciasFiltradas.filter(
                d => d.estado_asignacion === "con_inspector" && !d.tiene_acompanantes
            );
        }

        // Calcular estadísticas desde la vista (ya están precomputadas)
        const sin_asignar = (todasLasDerivas || []).filter(d => d.estado_asignacion === "sin_asignar").length;
        const pendiente_acompanantes = (todasLasDerivas || []).filter(
            d => d.estado_asignacion === "con_inspector" && !d.tiene_acompanantes
        ).length;
        const vencidas_sla = (todasLasDerivas || []).filter(d => d.vencida_sla).length;

        const queryTime = Date.now() - startTime;

        // Formatear respuesta
        const denunciasFormateadas = denunciasFiltradas.map(d => ({
            folio: d.folio,
            titulo: d.titulo,
            categoria: d.categoria || "Sin categoría",
            prioridad: d.prioridad || "No asignada",
            fecha_creacion: d.fecha_creacion,
            ubicacion_texto: d.ubicacion_texto,
            inspector_asignado: d.inspector_asignado,
            tiene_acompanantes: d.tiene_acompanantes,
            horas_sin_asignar: Math.floor(d.horas_sin_asignar),
        }));

        const totalTime = Date.now() - startTime;

        logger.info("Derivaciones obtenidas", {
            vista,
            cantidad: denunciasFormateadas.length,
            queryTime,
            totalTime,
        });

        return NextResponse.json(
            {
                denuncias: denunciasFormateadas,
                stats: {
                    sin_asignar,
                    pendiente_acompanantes,
                    vencidas_sla,
                },
            },
            {
                headers: {
                    "X-Query-Time": `${queryTime}ms`,
                    "X-Response-Time": `${totalTime}ms`,
                    "Cache-Control": "private, max-age=300",
                },
            }
        );
    } catch (error) {
        logger.error("Error en GET /api/derivaciones", error instanceof Error ? error : undefined);
        return NextResponse.json({ error: "Error al obtener derivaciones" }, { status: 500 });
    }
}
