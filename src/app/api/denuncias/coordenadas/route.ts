import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const supabase = await createClient();

        // Obtener denuncias con coordenadas
        const { data: denuncias, error } = await supabase
            .from("denuncias")
            .select(
                `
        folio,
        coords_x,
        coords_y,
        ubicacion_texto,
        fecha_creacion,
        prioridad_id,
        estado_id,
        categoria_publica_id
      `
            )
            .not("coords_x", "is", null)
            .not("coords_y", "is", null);

        if (error) {
            console.error("Error al obtener coordenadas:", error);
            return NextResponse.json(
                { error: "Error al obtener coordenadas de denuncias" },
                { status: 500 }
            );
        }

        // Obtener IDs únicos para las consultas relacionadas
        const prioridadIds = Array.from(new Set(denuncias?.map((d) => d.prioridad_id).filter(Boolean) || []));
        const estadoIds = Array.from(new Set(denuncias?.map((d) => d.estado_id).filter(Boolean) || []));
        const categoriaIds = Array.from(new Set(denuncias?.map((d) => d.categoria_publica_id).filter(Boolean) || []));

        // Mapa de colores por prioridad (asignados manualmente)
        const coloresPrioridad: Record<string, string> = {
            "Baja": "#10b981",      // Verde
            "Media": "#f59e0b",     // Amarillo/Naranja
            "Alta": "#ef4444",      // Rojo
            "Urgencia": "#7c3aed",  // Morado
        };

        // Consultar tablas relacionadas
        const [prioridadesRes, estadosRes, categoriasRes] = await Promise.all([
            supabase.from("prioridades_denuncia").select("id, nombre").in("id", prioridadIds),
            supabase.from("estados_denuncia").select("id, nombre").in("id", estadoIds),
            supabase.from("categorias_publicas").select("id, nombre").in("id", categoriaIds),
        ]);

        // Crear mapas para búsqueda rápida (asignando color según nombre de prioridad)
        const prioridadMap = new Map(
            prioridadesRes.data?.map((p) => [
                p.id,
                {
                    nombre: p.nombre,
                    color: coloresPrioridad[p.nombre] || "#808080"
                }
            ]) || []
        );
        const estadoMap = new Map(estadosRes.data?.map((e) => [e.id, e.nombre]) || []);
        const categoriaMap = new Map(categoriasRes.data?.map((c) => [c.id, c.nombre]) || []);

        // Formatear datos para el mapa
        const coordenadas = denuncias?.map((denuncia) => {
            const prioridad = prioridadMap.get(denuncia.prioridad_id);

            return {
                folio: denuncia.folio,
                lat: parseFloat(denuncia.coords_y || "0"),
                lng: parseFloat(denuncia.coords_x || "0"),
                ubicacion: denuncia.ubicacion_texto || "Sin ubicación",
                prioridad: prioridad?.nombre || "Sin prioridad",
                color: prioridad?.color || "#808080", // Color por defecto gris
                estado: estadoMap.get(denuncia.estado_id) || "Sin estado",
                categoria: categoriaMap.get(denuncia.categoria_publica_id) || "Sin categoría",
                fecha: denuncia.fecha_creacion,
            };
        }) || [];

        console.log(`✅ ${coordenadas.length} denuncias con coordenadas encontradas`);

        return NextResponse.json({
            coordenadas,
            total: coordenadas.length,
        });
    } catch (error) {
        console.error("Error en API de coordenadas:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
