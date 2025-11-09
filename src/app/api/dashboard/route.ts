import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Obtener todas las denuncias con información relevante
        const { data: denuncias, error: denunciasError } = await supabase
            .from("denuncias")
            .select(`
        id,
        folio,
        titulo,
        fecha_creacion,
        inspector_id,
        categoria_publica_id,
        prioridad_id,
        estado_id
      `);

        if (denunciasError) {
            return NextResponse.json({ error: denunciasError.message }, { status: 500 });
        }

        // 2. Obtener categorías
        const { data: categorias } = await supabase
            .from("categorias_publicas")
            .select("id, nombre");

        // 3. Obtener prioridades
        const { data: prioridades } = await supabase
            .from("prioridades_denuncia")
            .select("id, nombre");

        // 4. Obtener estados
        const { data: estados } = await supabase
            .from("estados_denuncia")
            .select("id, nombre");

        // Mapear datos
        const categoriasMap = new Map(categorias?.map((c) => [c.id, c.nombre]) || []);
        const prioridadesMap = new Map(prioridades?.map((p) => [p.id, p.nombre]) || []);
        const estadosMap = new Map(estados?.map((e) => [e.id, e.nombre]) || []);

        // 5. Calcular estadísticas generales
        const totalDenuncias = denuncias?.length || 0;
        const denunciasAsignadas = denuncias?.filter((d) => d.inspector_id).length || 0;
        const denunciasSinAsignar = totalDenuncias - denunciasAsignadas;

        // 6. Agrupar por categoría
        const porCategoria: Record<string, number> = {};
        denuncias?.forEach((d) => {
            const categoria = categoriasMap.get(d.categoria_publica_id) || "Sin categoría";
            porCategoria[categoria] = (porCategoria[categoria] || 0) + 1;
        });

        // 7. Agrupar por prioridad
        const porPrioridad: Record<string, number> = {};
        denuncias?.forEach((d) => {
            if (d.prioridad_id) {
                const prioridad = prioridadesMap.get(d.prioridad_id) || "Sin prioridad";
                porPrioridad[prioridad] = (porPrioridad[prioridad] || 0) + 1;
            }
        });

        // 8. Agrupar por estado
        const porEstado: Record<string, number> = {};
        denuncias?.forEach((d) => {
            const estado = estadosMap.get(d.estado_id) || "Sin estado";
            porEstado[estado] = (porEstado[estado] || 0) + 1;
        });

        // 9. Denuncias por mes (últimos 6 meses)
        const ahora = new Date();
        const denunciasPorMes: { mes: string; total: number; asignadas: number; sin_asignar: number }[] = [];

        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
            const mesNombre = fecha.toLocaleString('es-CL', { month: 'long' });
            const mesSiguiente = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1);

            const denunciasMes = denuncias?.filter((d) => {
                const fechaDenuncia = new Date(d.fecha_creacion);
                return fechaDenuncia >= fecha && fechaDenuncia < mesSiguiente;
            }) || [];

            denunciasPorMes.push({
                mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
                total: denunciasMes.length,
                asignadas: denunciasMes.filter((d) => d.inspector_id).length,
                sin_asignar: denunciasMes.filter((d) => !d.inspector_id).length,
            });
        }

        // 10. Calcular tiempo promedio de asignación (denuncias asignadas)
        let tiempoPromedioAsignacion = 0;
        const denunciasConAsignacion = denuncias?.filter((d) => d.inspector_id) || [];

        if (denunciasConAsignacion.length > 0) {
            const tiempos = await Promise.all(
                denunciasConAsignacion.map(async (d) => {
                    const { data: asignacion } = await supabase
                        .from("asignaciones_inspector")
                        .select("fecha_derivacion")
                        .eq("denuncia_id", d.id)
                        .order("fecha_derivacion", { ascending: true })
                        .limit(1)
                        .single();

                    if (asignacion) {
                        const fechaCreacion = new Date(d.fecha_creacion).getTime();
                        const fechaAsignacion = new Date(asignacion.fecha_derivacion).getTime();
                        return (fechaAsignacion - fechaCreacion) / (1000 * 60 * 60); // horas
                    }
                    return 0;
                })
            );

            const tiemposValidos = tiempos.filter((t) => t > 0);
            if (tiemposValidos.length > 0) {
                tiempoPromedioAsignacion = tiemposValidos.reduce((a, b) => a + b, 0) / tiemposValidos.length;
            }
        }

        // 11. Top 5 categorías
        const topCategorias = Object.entries(porCategoria)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([nombre, cantidad]) => ({ nombre, cantidad }));

        // 12. Categorías vs Prioridad (matriz)
        const categoriasPrioridad: Record<string, Record<string, number>> = {};
        denuncias?.forEach((d) => {
            const categoria = categoriasMap.get(d.categoria_publica_id) || "Sin categoría";
            const prioridad = d.prioridad_id ? (prioridadesMap.get(d.prioridad_id) || "Sin prioridad") : "Sin prioridad";

            if (!categoriasPrioridad[categoria]) {
                categoriasPrioridad[categoria] = {};
            }
            categoriasPrioridad[categoria][prioridad] = (categoriasPrioridad[categoria][prioridad] || 0) + 1;
        });

        // 13. Tasa de crecimiento mensual
        const crecimientoMensual = denunciasPorMes.map((mes, index) => {
            if (index === 0) return { mes: mes.mes, crecimiento: 0 };
            const anterior = denunciasPorMes[index - 1].total;
            const actual = mes.total;
            const crecimiento = anterior > 0 ? ((actual - anterior) / anterior) * 100 : 0;
            return { mes: mes.mes, crecimiento: Math.round(crecimiento * 10) / 10 };
        });

        // 14. Heat Map - Denuncias por día de semana y hora
        const heatMapDiaHora: Record<string, Record<number, number>> = {};
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        diasSemana.forEach(dia => {
            heatMapDiaHora[dia] = {};
            for (let h = 0; h < 24; h++) {
                heatMapDiaHora[dia][h] = 0;
            }
        });

        denuncias?.forEach((d) => {
            const fecha = new Date(d.fecha_creacion);
            const dia = diasSemana[fecha.getDay()];
            const hora = fecha.getHours();
            heatMapDiaHora[dia][hora]++;
        });

        // 15. Obtener inspectores y su carga de trabajo
        const { data: inspectores } = await supabase
            .from("inspectores")
            .select(`
                id,
                usuario_id,
                tipo_turno,
                activo,
                perfiles_ciudadanos!inner (
                    nombre,
                    apellido
                ),
                turno_tipo!inner (
                    nombre
                )
            `);

        const cargaInspectores: { nombre: string; cantidad: number; turno: string }[] = [];
        const eficienciaInspectores: { nombre: string; cantidad: number; tiempoPromedio: number }[] = [];
        const distribucionTurno: Record<string, number> = {};

        for (const inspector of inspectores || []) {
            const perfil = Array.isArray(inspector.perfiles_ciudadanos)
                ? inspector.perfiles_ciudadanos[0]
                : inspector.perfiles_ciudadanos;
            const turno = Array.isArray(inspector.turno_tipo)
                ? inspector.turno_tipo[0]
                : inspector.turno_tipo;

            const nombreInspector = `${perfil.nombre} ${perfil.apellido}`;
            const nombreTurno = turno.nombre;

            // Contar distribución por turno
            distribucionTurno[nombreTurno] = (distribucionTurno[nombreTurno] || 0) + 1;

            // Obtener asignaciones del inspector
            const { data: asignaciones } = await supabase
                .from("asignaciones_inspector")
                .select("denuncia_id, fecha_derivacion, fecha_termino")
                .eq("inspector_id", inspector.id);

            const cantidadAsignaciones = asignaciones?.length || 0;

            // Calcular tiempo promedio de resolución
            let tiempoPromedioResolucion = 0;
            const asignacionesCompletas = asignaciones?.filter(a => a.fecha_termino) || [];

            if (asignacionesCompletas.length > 0) {
                const tiempos = asignacionesCompletas.map(a => {
                    const inicio = new Date(a.fecha_derivacion).getTime();
                    const fin = new Date(a.fecha_termino!).getTime();
                    return (fin - inicio) / (1000 * 60 * 60); // horas
                });
                tiempoPromedioResolucion = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
            }

            cargaInspectores.push({
                nombre: nombreInspector,
                cantidad: cantidadAsignaciones,
                turno: nombreTurno
            });

            eficienciaInspectores.push({
                nombre: nombreInspector,
                cantidad: cantidadAsignaciones,
                tiempoPromedio: Math.round(tiempoPromedioResolucion * 10) / 10
            });
        }

        // Top 10 inspectores más activos (por denuncias cerradas)
        const inspectoresActivos = eficienciaInspectores
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10);

        // 16. Tiempo promedio por estado (análisis de historial)
        const { data: historial } = await supabase
            .from("denuncia_historial")
            .select("denuncia_id, campo_modificado, valor_anterior, valor_nuevo, fecha_modificacion")
            .eq("campo_modificado", "estado_id");

        const tiempoPorEstado: Record<string, { total: number; count: number }> = {};

        // Agrupar cambios de estado por denuncia
        const cambiosPorDenuncia: Record<number, Array<{ estado: number; fecha: string }>> = {};
        historial?.forEach(h => {
            if (!cambiosPorDenuncia[h.denuncia_id]) {
                cambiosPorDenuncia[h.denuncia_id] = [];
            }
            if (h.valor_nuevo) {
                cambiosPorDenuncia[h.denuncia_id].push({
                    estado: parseInt(h.valor_nuevo),
                    fecha: h.fecha_modificacion
                });
            }
        });

        // Calcular tiempo en cada estado
        Object.values(cambiosPorDenuncia).forEach(cambios => {
            cambios.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

            for (let i = 0; i < cambios.length - 1; i++) {
                const estadoActual = cambios[i].estado;
                const fechaInicio = new Date(cambios[i].fecha).getTime();
                const fechaFin = new Date(cambios[i + 1].fecha).getTime();
                const horas = (fechaFin - fechaInicio) / (1000 * 60 * 60);

                const nombreEstado = estadosMap.get(estadoActual) || "Desconocido";
                if (!tiempoPorEstado[nombreEstado]) {
                    tiempoPorEstado[nombreEstado] = { total: 0, count: 0 };
                }
                tiempoPorEstado[nombreEstado].total += horas;
                tiempoPorEstado[nombreEstado].count++;
            }
        });

        const tiempoPromedioEstado = Object.entries(tiempoPorEstado).map(([estado, data]) => ({
            estado,
            horas: Math.round((data.total / data.count) * 10) / 10
        }));

        // 17. Embudo de conversión
        const embudoConversion = estados?.map(e => ({
            estado: e.nombre,
            cantidad: denuncias?.filter(d => d.estado_id === e.id).length || 0
        })) || [];

        // 18. SLA - Denuncias vencidas vs cumplidas (48 horas)
        let denunciasVencidasSLA = 0;
        let denunciasCumplidasSLA = 0;

        for (const d of denunciasConAsignacion) {
            const { data: asignacion } = await supabase
                .from("asignaciones_inspector")
                .select("fecha_derivacion")
                .eq("denuncia_id", d.id)
                .order("fecha_derivacion", { ascending: true })
                .limit(1)
                .single();

            if (asignacion) {
                const fechaCreacion = new Date(d.fecha_creacion).getTime();
                const fechaAsignacion = new Date(asignacion.fecha_derivacion).getTime();
                const horas = (fechaAsignacion - fechaCreacion) / (1000 * 60 * 60);

                if (horas > 48) {
                    denunciasVencidasSLA++;
                } else {
                    denunciasCumplidasSLA++;
                }
            }
        }

        const cumplimientoSLA = denunciasConAsignacion.length > 0
            ? Math.round((denunciasCumplidasSLA / denunciasConAsignacion.length) * 100)
            : 0;

        // 19. Tendencia de tiempo de respuesta (mes a mes)
        const tendenciaTiempoRespuesta = await Promise.all(
            denunciasPorMes.map(async (mesData) => {
                const denunciasMesArray = denuncias?.filter((d) => {
                    const fechaDenuncia = new Date(d.fecha_creacion);
                    const mesNombre = fechaDenuncia.toLocaleString('es-CL', { month: 'long' });
                    return mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1) === mesData.mes;
                }) || [];

                const tiemposAsignacion = await Promise.all(
                    denunciasMesArray
                        .filter(d => d.inspector_id)
                        .map(async (d) => {
                            const { data: asignacion } = await supabase
                                .from("asignaciones_inspector")
                                .select("fecha_derivacion")
                                .eq("denuncia_id", d.id)
                                .order("fecha_derivacion", { ascending: true })
                                .limit(1)
                                .single();

                            if (asignacion) {
                                const fechaCreacion = new Date(d.fecha_creacion).getTime();
                                const fechaAsignacion = new Date(asignacion.fecha_derivacion).getTime();
                                return (fechaAsignacion - fechaCreacion) / (1000 * 60 * 60);
                            }
                            return 0;
                        })
                );

                const tiemposValidos = tiemposAsignacion.filter(t => t > 0);
                const promedio = tiemposValidos.length > 0
                    ? tiemposValidos.reduce((a, b) => a + b, 0) / tiemposValidos.length
                    : 0;

                return {
                    mes: mesData.mes,
                    horas: Math.round(promedio * 10) / 10
                };
            })
        );

        // 20. Top 10 ubicaciones más reportadas
        const { data: denunciasUbicacion } = await supabase
            .from("denuncias")
            .select("ubicacion_texto");

        const ubicacionesCount: Record<string, number> = {};
        denunciasUbicacion?.forEach(d => {
            if (d.ubicacion_texto) {
                const ubicacion = d.ubicacion_texto.trim();
                ubicacionesCount[ubicacion] = (ubicacionesCount[ubicacion] || 0) + 1;
            }
        });

        const topUbicaciones = Object.entries(ubicacionesCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([ubicacion, cantidad]) => ({ ubicacion, cantidad }));

        // 21. Categorías: Asignadas vs Sin Asignar
        const categoriasAsignacion: Record<string, { asignadas: number; sin_asignar: number }> = {};
        denuncias?.forEach((d) => {
            const categoria = categoriasMap.get(d.categoria_publica_id) || "Sin categoría";
            if (!categoriasAsignacion[categoria]) {
                categoriasAsignacion[categoria] = { asignadas: 0, sin_asignar: 0 };
            }
            if (d.inspector_id) {
                categoriasAsignacion[categoria].asignadas++;
            } else {
                categoriasAsignacion[categoria].sin_asignar++;
            }
        });

        // 22. Estados: Evolución en el tiempo (últimos 6 meses)
        const estadosEvolucion = denunciasPorMes.map(mesData => {
            const denunciasMesArray = denuncias?.filter((d) => {
                const fechaDenuncia = new Date(d.fecha_creacion);
                const mesNombre = fechaDenuncia.toLocaleString('es-CL', { month: 'long' });
                return mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1) === mesData.mes;
            }) || [];

            const estadosPorMes: Record<string, number> = {};
            denunciasMesArray.forEach(d => {
                const estado = estadosMap.get(d.estado_id) || "Sin estado";
                estadosPorMes[estado] = (estadosPorMes[estado] || 0) + 1;
            });

            return {
                mes: mesData.mes,
                estados: estadosPorMes
            };
        });

        // 23. Tasa de resolución por categoría
        const tasaResolucionCategoria = Object.entries(porCategoria).map(([categoria, total]) => {
            const denunciasCategoria = denuncias?.filter(d =>
                (categoriasMap.get(d.categoria_publica_id) || "Sin categoría") === categoria
            ) || [];

            // Buscar estados que indiquen resolución (asumiendo que hay un estado "Resuelta" o "Cerrada")
            const resueltas = denunciasCategoria.filter(d => {
                const estado = estadosMap.get(d.estado_id) || "";
                return estado.toLowerCase().includes("resuelta") || estado.toLowerCase().includes("cerrada");
            }).length;

            const tasa = total > 0 ? Math.round((resueltas / total) * 100) : 0;

            return {
                categoria,
                total,
                resueltas,
                tasa
            };
        });

        // 24. Comparativa año actual vs año anterior
        const añoActual = ahora.getFullYear();
        const comparativaAnual: { mes: string; actual: number; anterior: number }[] = [];

        for (let i = 5; i >= 0; i--) {
            const fechaActual = new Date(añoActual, ahora.getMonth() - i, 1);
            const fechaAnterior = new Date(añoActual - 1, ahora.getMonth() - i, 1);
            const mesNombre = fechaActual.toLocaleString('es-CL', { month: 'long' });
            const mesSiguiente = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1);
            const mesSiguienteAnterior = new Date(fechaAnterior.getFullYear(), fechaAnterior.getMonth() + 1, 1);

            const denunciasActual = denuncias?.filter((d) => {
                const fechaDenuncia = new Date(d.fecha_creacion);
                return fechaDenuncia >= fechaActual && fechaDenuncia < mesSiguiente;
            }).length || 0;

            const denunciasAnterior = denuncias?.filter((d) => {
                const fechaDenuncia = new Date(d.fecha_creacion);
                return fechaDenuncia >= fechaAnterior && fechaDenuncia < mesSiguienteAnterior;
            }).length || 0;

            comparativaAnual.push({
                mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
                actual: denunciasActual,
                anterior: denunciasAnterior
            });
        }

        // 25. Proyección de denuncias (regresión lineal simple)
        const proyeccionDenuncias = [...denunciasPorMes];
        if (denunciasPorMes.length >= 3) {
            // Calcular tendencia de los últimos 3 meses
            const ultimos3 = denunciasPorMes.slice(-3);
            const promedio = ultimos3.reduce((sum, m) => sum + m.total, 0) / 3;
            const tendencia = (ultimos3[2].total - ultimos3[0].total) / 2;

            // Proyectar 3 meses adelante
            for (let i = 1; i <= 3; i++) {
                const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + i, 1);
                const mesNombre = fecha.toLocaleString('es-CL', { month: 'long' });
                const proyectado = Math.max(0, Math.round(promedio + (tendencia * i)));

                proyeccionDenuncias.push({
                    mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
                    total: proyectado,
                    asignadas: 0,
                    sin_asignar: 0
                });
            }
        }

        // 26. Word Cloud - Títulos de denuncias (extraer palabras más frecuentes)
        const palabrasCount: Record<string, number> = {};
        const palabrasExcluidas = new Set(['de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'del', 'un', 'una', 'por', 'para', 'con', 'sin']);

        denuncias?.forEach(d => {
            if (d.titulo) {
                const palabras = d.titulo.toLowerCase().split(/\s+/);
                palabras.forEach((palabra: string) => {
                    const limpia = palabra.replace(/[^a-záéíóúñü]/g, '');
                    if (limpia.length > 3 && !palabrasExcluidas.has(limpia)) {
                        palabrasCount[limpia] = (palabrasCount[limpia] || 0) + 1;
                    }
                });
            }
        });

        const wordCloud = Object.entries(palabrasCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 50)
            .map(([palabra, frecuencia]) => ({ palabra, frecuencia }));

        // 27. Indicador de Salud del Sistema (score compuesto)
        const scoreSLA = cumplimientoSLA; // 0-100
        const scoreAsignacion = totalDenuncias > 0 ? (denunciasAsignadas / totalDenuncias) * 100 : 0;
        const denunciasResueltas = denuncias?.filter(d => {
            const estado = estadosMap.get(d.estado_id) || "";
            return estado.toLowerCase().includes("resuelta") || estado.toLowerCase().includes("cerrada");
        }).length || 0;
        const scoreResolucion = totalDenuncias > 0 ? (denunciasResueltas / totalDenuncias) * 100 : 0;

        const saludSistema = Math.round((scoreSLA * 0.4 + scoreAsignacion * 0.3 + scoreResolucion * 0.3));

        return NextResponse.json({
            // Datos básicos (ya existentes)
            resumen: {
                total_denuncias: totalDenuncias,
                denuncias_asignadas: denunciasAsignadas,
                denuncias_sin_asignar: denunciasSinAsignar,
                tiempo_promedio_asignacion_horas: Math.round(tiempoPromedioAsignacion * 10) / 10,
            },
            por_categoria: porCategoria,
            por_prioridad: porPrioridad,
            por_estado: porEstado,
            denuncias_por_mes: denunciasPorMes,
            top_categorias: topCategorias,

            // Nuevos datos
            categorias_prioridad: categoriasPrioridad,
            crecimiento_mensual: crecimientoMensual,
            heat_map_dia_hora: heatMapDiaHora,
            carga_inspectores: cargaInspectores.sort((a, b) => b.cantidad - a.cantidad),
            eficiencia_inspectores: eficienciaInspectores,
            inspectores_activos: inspectoresActivos,
            distribucion_turno: distribucionTurno,
            tiempo_promedio_estado: tiempoPromedioEstado,
            embudo_conversion: embudoConversion,
            sla: {
                cumplidas: denunciasCumplidasSLA,
                vencidas: denunciasVencidasSLA,
                porcentaje_cumplimiento: cumplimientoSLA
            },
            tendencia_tiempo_respuesta: tendenciaTiempoRespuesta,
            top_ubicaciones: topUbicaciones,
            categorias_asignacion: categoriasAsignacion,
            estados_evolucion: estadosEvolucion,
            tasa_resolucion_categoria: tasaResolucionCategoria,
            comparativa_anual: comparativaAnual,
            proyeccion_denuncias: proyeccionDenuncias,
            word_cloud: wordCloud,
            salud_sistema: {
                score: saludSistema,
                sla: scoreSLA,
                asignacion: Math.round(scoreAsignacion),
                resolucion: Math.round(scoreResolucion)
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
