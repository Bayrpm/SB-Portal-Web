import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatFullName } from "@/lib/utils/formatName";

export const runtime = "nodejs";

export async function GET() {
    try {
        const supabase = await createClient();
        // Consulta optimizada: anida los datos relacionados en una sola consulta
        const { data, error } = await supabase
            .from("denuncias")
            .select(`
                folio,
                titulo,
                fecha_creacion,
                ubicacion_texto,
                prioridad_id,
                ciudadano:perfiles_ciudadanos!denuncias_ciudadano_id_fkey (nombre, apellido),
                categoria:categorias_publicas (nombre),
                prioridad:prioridades_denuncia (nombre)
            `);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Formatear resultado final
        const denuncias = (data || []).map((d) => {
            // Relaciones anidadas: Supabase retorna arrays aunque sea 1:1
            const ciudadano = Array.isArray(d.ciudadano) ? d.ciudadano[0] : d.ciudadano;
            const categoria = Array.isArray(d.categoria) ? d.categoria[0] : d.categoria;
            const prioridad = Array.isArray(d.prioridad) ? d.prioridad[0] : d.prioridad;
            return {
                folio: d.folio,
                nombre:
                    ciudadano && ciudadano.nombre
                        ? formatFullName(ciudadano.nombre, ciudadano.apellido)
                        : "Sin nombre",
                titulo: d.titulo || "",
                categoria: categoria?.nombre || "Sin categoría",
                prioridad_id: d.prioridad_id ?? null,
                prioridad: prioridad?.nombre || "No asignada",
                fecha_creacion: d.fecha_creacion,
                ubicacion_texto: d.ubicacion_texto,
            };
        });

        return NextResponse.json({ denuncias });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}
