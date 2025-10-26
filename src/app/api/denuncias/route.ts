import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const supabase = await createClient();
        // Consulta con joins para obtener los datos requeridos
        const { data, error } = await supabase
            .from("denuncias")
            .select(`
        folio,
        ciudadano_id,
        titulo,
        categoria_publica_id,
        prioridad_id,
        fecha_creacion,
        ubicacion_texto
      `);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Obtener los ids únicos de ciudadanos, categorías y prioridades
        const ciudadanoIds = Array.from(new Set((data || []).map((d) => d.ciudadano_id)));
        const categoriaIds = Array.from(new Set((data || []).map((d) => d.categoria_publica_id)));
        const prioridadIds = Array.from(new Set((data || []).map((d) => d.prioridad_id).filter(Boolean)));

        // Obtener nombres de ciudadanos
        const { data: ciudadanos, error: errorCiudadanos } = await supabase
            .from("perfiles_ciudadanos")
            .select("usuario_id, nombre, apellido")
            .in("usuario_id", ciudadanoIds);
        if (errorCiudadanos) {
            return NextResponse.json({ error: errorCiudadanos.message }, { status: 500 });
        }
        const ciudadanoMap = new Map(
            (ciudadanos || []).map((c) => {
                const nombreCompleto = `${c.nombre || ''} ${c.apellido || ''}`.trim();
                return [c.usuario_id, nombreCompleto ? nombreCompleto : "Sin nombre"];
            })
        );

        // Obtener nombres de categorías
        const { data: categorias, error: errorCategorias } = await supabase
            .from("categorias_publicas")
            .select("id, nombre")
            .in("id", categoriaIds);
        if (errorCategorias) {
            return NextResponse.json({ error: errorCategorias.message }, { status: 500 });
        }
        const categoriaMap = new Map((categorias || []).map((c) => [c.id, c.nombre]));

        // Obtener nombres de prioridades
        let prioridadMap = new Map();
        if (prioridadIds.length > 0) {
            const { data: prioridades, error: errorPrioridades } = await supabase
                .from("prioridades_denuncia")
                .select("id, nombre")
                .in("id", prioridadIds);
            if (errorPrioridades) {
                return NextResponse.json({ error: errorPrioridades.message }, { status: 500 });
            }
            prioridadMap = new Map((prioridades || []).map((p) => [p.id, p.nombre]));
        }

        // Formatear resultado final
        const denuncias = (data || []).map((d) => ({
            folio: d.folio,
            nombre: ciudadanoMap.get(d.ciudadano_id) || "Sin nombre",
            titulo: d.titulo || "",
            categoria: categoriaMap.get(d.categoria_publica_id) || "Sin categoría",
            prioridad_id: d.prioridad_id || "No asignada",
            prioridad: d.prioridad_id ? (prioridadMap.get(d.prioridad_id) || "Sin prioridad") : "No asignada",
            fecha_creacion: d.fecha_creacion,
            ubicacion_texto: d.ubicacion_texto,
        }));

        return NextResponse.json({ denuncias });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}
