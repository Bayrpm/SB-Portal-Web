import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const supabase = await createClient();

        // Consumir la vista materializada optimizada
        const { data: viewData, error: viewError } = await supabase
            .from("dashboard_metricas_v1")
            .select("datos")
            .single();

        if (viewError) {
            console.error("Error al obtener datos de la vista materializada:", viewError);
            return NextResponse.json({
                error: "Error al obtener datos del dashboard",
                details: viewError.message
            }, { status: 500 });
        }

        if (!viewData || !viewData.datos) {
            return NextResponse.json({
                error: "No se encontraron datos en la vista materializada"
            }, { status: 404 });
        }

        // Extraer los datos del JSONB
        const dashboardData = viewData.datos;

        // Transformar los datos de la vista al formato esperado por el frontend
        const metricas = dashboardData.metricas_generales || {};
        const porCategoria = dashboardData.por_categoria || [];
        const porPrioridad = dashboardData.por_prioridad || [];
        const porEstado = dashboardData.por_estado || [];
        const porMes = dashboardData.por_mes || [];

        // Transformar top categorías (top 10)
        const topCategorias = porCategoria
            .sort((a: { cantidad: number }, b: { cantidad: number }) => b.cantidad - a.cantidad)
            .slice(0, 10)
            .map((cat: { categoria: string; cantidad: number }) => ({
                categoria: cat.categoria,
                total: cat.cantidad
            }));

        // Transformar categoría x prioridad a formato legacy
        const categoriaPrioridadRaw = dashboardData.categoria_prioridad || [];
        const categoriasPrioridad = categoriaPrioridadRaw.reduce((acc: Record<string, { baja: number; media: number; alta: number }>, item: { categoria: string; prioridad: string; cantidad: number }) => {
            if (!acc[item.categoria]) {
                acc[item.categoria] = { baja: 0, media: 0, alta: 0 };
            }
            const prioridadLower = item.prioridad.toLowerCase();
            if (prioridadLower.includes('baja')) acc[item.categoria].baja = item.cantidad;
            if (prioridadLower.includes('media')) acc[item.categoria].media = item.cantidad;
            if (prioridadLower.includes('alta')) acc[item.categoria].alta = item.cantidad;
            return acc;
        }, {});

        // Transformar inspectores_carga a formato legacy
        const inspectoresCargaRaw = dashboardData.inspectores_carga || [];
        const cargaInspectores = inspectoresCargaRaw.map((insp: { inspector_nombre: string; total_asignaciones: number; asignaciones_completadas: number; turno_nombre: string }) => ({
            inspector: insp.inspector_nombre,
            asignadas: insp.total_asignaciones || 0,
            en_proceso: (insp.total_asignaciones || 0) - (insp.asignaciones_completadas || 0),
            resueltas: insp.asignaciones_completadas || 0,
            turno: insp.turno_nombre || 'Sin turno'
        }));

        const eficienciaInspectores = inspectoresCargaRaw.map((insp: { inspector_nombre: string; asignaciones_completadas: number; promedio_horas_resolucion: number }) => ({
            inspector: insp.inspector_nombre,
            total_gestionadas: insp.asignaciones_completadas || 0,
            tiempo_promedio_horas: Math.round((insp.promedio_horas_resolucion || 0) * 10) / 10
        }));

        const inspectoresActivos = inspectoresCargaRaw
            .sort((a: { asignaciones_completadas: number }, b: { asignaciones_completadas: number }) => (b.asignaciones_completadas || 0) - (a.asignaciones_completadas || 0))
            .slice(0, 10)
            .map((insp: { inspector_nombre: string; asignaciones_completadas: number; promedio_horas_resolucion: number }) => ({
                inspector: insp.inspector_nombre,
                denuncias_gestionadas: insp.asignaciones_completadas || 0,
                tiempo_promedio_horas: Math.round((insp.promedio_horas_resolucion || 0) * 10) / 10
            }));

        // Transformar distribución turno
        const distribucionTurnoRaw = dashboardData.distribucion_turno || [];
        const distribucionTurno = distribucionTurnoRaw.map((item: { turno: string; cantidad_inspectores: number }) => ({
            turno: item.turno,
            cantidad: item.cantidad_inspectores
        }));

        // Transformar heat map - mantener como array para que el frontend lo transforme
        const heatMapRaw = dashboardData.heat_map || [];
        const heatMapDiaHora = heatMapRaw.map((item: { dia_semana: number; hora: number; cantidad: number }) => ({
            dia: item.dia_semana, // Mantener como número para la transformación del frontend
            hora: item.hora,
            cantidad: item.cantidad
        }));

        // Transformar crecimiento mensual
        const crecimientoMensualRaw = dashboardData.crecimiento_mensual || [];
        const crecimientoMensual = crecimientoMensualRaw
            .filter((item: { tasa_crecimiento: number | null }) => item.tasa_crecimiento !== null)
            .map((item: { periodo: string; tasa_crecimiento: number }) => ({
                mes: item.periodo,
                tasa: item.tasa_crecimiento
            }));

        // Transformar embudo conversión
        const embudoRaw = dashboardData.embudo_conversion || [];
        const embudoConversion = embudoRaw.map((item: { etapa: string; cantidad: number; porcentaje: number }) => ({
            etapa: item.etapa,
            cantidad: item.cantidad,
            porcentaje: item.porcentaje
        }));

        // Transformar top ubicaciones
        const topUbicacionesRaw = dashboardData.top_ubicaciones || [];
        const topUbicaciones = topUbicacionesRaw.map((item: { ubicacion: string; cantidad: number }) => ({
            ubicacion: item.ubicacion,
            cantidad: item.cantidad
        }));

        // Transformar word cloud
        const wordCloudRaw = dashboardData.word_cloud || [];
        const wordCloud = wordCloudRaw.map((item: { palabra: string; frecuencia: number }) => ({
            palabra: item.palabra,
            frecuencia: item.frecuencia
        }));

        // Transformar denuncias por mes a formato legacy
        const denunciasPorMes = porMes.map((item: { mes_nombre: string; total: number; asignadas: number; sin_asignar: number }) => ({
            mes: item.mes_nombre,
            total: item.total,
            asignadas: item.asignadas,
            sin_asignar: item.sin_asignar
        }));

        // Calcular SLA
        const slaCumplidas = metricas.sla_cumplidas || 0;
        const slaTotal = metricas.sla_total || 0;
        const cumplimientoSLA = metricas.porcentaje_cumplimiento_sla || 0;

        // Calcular salud del sistema
        const totalDenuncias = metricas.total_denuncias || 0;
        const denunciasAsignadas = metricas.denuncias_asignadas || 0;
        const denunciasResueltas = metricas.denuncias_resueltas || 0;

        const scoreSLA = cumplimientoSLA;
        const scoreAsignacion = totalDenuncias > 0 ? (denunciasAsignadas / totalDenuncias) * 100 : 0;
        const scoreResolucion = totalDenuncias > 0 ? (denunciasResueltas / totalDenuncias) * 100 : 0;
        const saludSistema = Math.round((scoreSLA * 0.4 + scoreAsignacion * 0.3 + scoreResolucion * 0.3));

        // Retornar datos en formato esperado por el frontend
        return NextResponse.json({
            resumen: {
                total_denuncias: totalDenuncias,
                denuncias_asignadas: denunciasAsignadas,
                denuncias_sin_asignar: metricas.denuncias_sin_asignar || 0,
                tiempo_promedio_asignacion_horas: metricas.promedio_horas_asignacion || 0,
            },
            por_categoria: porCategoria,
            por_prioridad: porPrioridad,
            por_estado: porEstado,
            denuncias_por_mes: denunciasPorMes,
            top_categorias: topCategorias,
            categorias_prioridad: Object.entries(categoriasPrioridad).map(([categoria, prioridades]) => ({
                categoria,
                ...(prioridades as { baja: number; media: number; alta: number })
            })),
            crecimiento_mensual: crecimientoMensual,
            heat_map_dia_hora: heatMapDiaHora,
            carga_inspectores: cargaInspectores,
            eficiencia_inspectores: eficienciaInspectores,
            inspectores_activos: inspectoresActivos,
            distribucion_turno: distribucionTurno,
            tiempo_promedio_estado: porEstado.map((estado: { estado: string; tiempo_promedio_horas: number }) => ({
                estado: estado.estado,
                horas_promedio: Math.round((estado.tiempo_promedio_horas || 0) * 10) / 10
            })),
            embudo_conversion: embudoConversion,
            sla: {
                cumplidas: slaCumplidas,
                vencidas: slaTotal - slaCumplidas,
                porcentaje_cumplimiento: cumplimientoSLA
            },
            tendencia_tiempo_respuesta: porMes.map((mes: { mes_nombre: string; promedio_horas_asignacion: number }) => ({
                mes: mes.mes_nombre,
                horas: mes.promedio_horas_asignacion || 0
            })),
            top_ubicaciones: topUbicaciones,
            categorias_asignacion: porCategoria.map((cat: { categoria: string; asignadas: number; sin_asignar: number }) => ({
                categoria: cat.categoria,
                asignadas: cat.asignadas || 0,
                sin_asignar: cat.sin_asignar || 0
            })),
            estados_evolucion: (() => {
                const evolucionRaw = dashboardData.estados_evolucion || [];
                // Agrupar por fecha
                const porFecha: Record<string, { fecha: string; pendiente: number; en_atencion: number; resuelta: number; cerrada: number }> = {};
                evolucionRaw.forEach((item: { periodo: string; estado: string; cantidad: number }) => {
                    if (!porFecha[item.periodo]) {
                        porFecha[item.periodo] = {
                            fecha: item.periodo,
                            pendiente: 0,
                            en_atencion: 0,
                            resuelta: 0,
                            cerrada: 0
                        };
                    }
                    const estadoNormalizado = item.estado.toLowerCase().replace(/\s+/g, '_');
                    if (estadoNormalizado.includes('pendiente')) porFecha[item.periodo].pendiente = item.cantidad;
                    if (estadoNormalizado.includes('atenci') || estadoNormalizado.includes('proceso')) porFecha[item.periodo].en_atencion = item.cantidad;
                    if (estadoNormalizado.includes('resuel')) porFecha[item.periodo].resuelta = item.cantidad;
                    if (estadoNormalizado.includes('cerr')) porFecha[item.periodo].cerrada = item.cantidad;
                });
                return Object.values(porFecha);
            })(),
            tasa_resolucion_categoria: porCategoria.map((cat: { categoria: string; tasa_resolucion: number; cantidad: number; resueltas: number }) => ({
                categoria: cat.categoria,
                total: cat.cantidad || 0,
                resueltas: cat.resueltas || 0,
                tasa: cat.tasa_resolucion || 0
            })),
            comparativa_anual: [], // TODO: Agregar a vista materializada con datos año anterior
            proyeccion_denuncias: (() => {
                // Calcular proyección basada en los últimos 6 meses
                if (porMes.length < 3) return [];

                const ultimos6Meses = porMes.slice(-6);
                const promedioMensual = ultimos6Meses.reduce((sum: number, m: { total: number }) => sum + (m.total || 0), 0) / ultimos6Meses.length;

                // Calcular tendencia (crecimiento promedio)
                let sumaCrec = 0;
                for (let i = 1; i < ultimos6Meses.length; i++) {
                    const actual = ultimos6Meses[i].total || 0;
                    const anterior = ultimos6Meses[i - 1].total || 0;
                    if (anterior > 0) {
                        sumaCrec += ((actual - anterior) / anterior);
                    }
                }
                const tasaCrecimiento = ultimos6Meses.length > 1 ? sumaCrec / (ultimos6Meses.length - 1) : 0;

                // Generar proyección para los próximos 3 meses
                const mesesFuturos = ['Diciembre', 'Enero', 'Febrero'];
                const proyeccion = [];

                // Agregar histórico
                ultimos6Meses.forEach((m: { mes_nombre: string; total: number; asignadas: number; sin_asignar: number }) => {
                    proyeccion.push({
                        mes: m.mes_nombre,
                        total: m.total,
                        asignadas: m.asignadas || 0,
                        sin_asignar: m.sin_asignar || 0
                    });
                });

                // Agregar proyección
                let ultimoValor = ultimos6Meses[ultimos6Meses.length - 1].total || promedioMensual;
                for (let i = 0; i < 3; i++) {
                    const proyectado = Math.round(ultimoValor * (1 + tasaCrecimiento));
                    proyeccion.push({
                        mes: mesesFuturos[i],
                        total: proyectado,
                        asignadas: Math.round(proyectado * 0.7), // Estimar 70% asignadas
                        sin_asignar: Math.round(proyectado * 0.3) // Estimar 30% sin asignar
                    });
                    ultimoValor = proyectado;
                }

                return proyeccion;
            })(),
            word_cloud: wordCloud,
            salud_sistema: {
                score: saludSistema,
                sla: Math.round(scoreSLA),
                asignacion: Math.round(scoreAsignacion),
                resolucion: Math.round(scoreResolucion)
            },
            _meta: {
                source: 'materialized_view',
                timestamp: dashboardData.timestamp,
                cached: true
            }
        });
    } catch (error) {
        console.error("Error en GET /api/dashboard:", error);
        return NextResponse.json(
            { error: "Error al obtener datos del dashboard" },
            { status: 500 }
        );
    }
}
