import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatFullName } from "@/lib/utils/formatName";

export async function GET(
    _req: Request,
    context: { params: Promise<{ folio: string }> }
) {
    try {
        const { folio } = await context.params;
        if (!folio) {
            return NextResponse.json(
                { error: "Folio es requerido" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Obtener las asignaciones desde la vista
        const { data: asignacion, error: asignacionError } = await supabase
            .from("v_denuncias_asignados")
            .select("*")
            .eq("folio", folio)
            .single();

        console.log("Asignación desde vista:", asignacion, asignacionError);

        // Si no hay datos en la vista, buscar directamente en denuncias
        if (asignacionError || !asignacion) {
            // Intentar obtener directamente de la tabla denuncias
            const { data: denuncia } = await supabase
                .from("denuncias")
                .select("id, inspector_id")
                .eq("folio", folio)
                .single();

            if (!denuncia || !denuncia.inspector_id) {
                return NextResponse.json({
                    inspector_principal: null,
                    acompanantes: [],
                });
            }

            // Obtener información del inspector
            const { data: inspector } = await supabase
                .from("inspectores")
                .select("id, nombre, apellido")
                .eq("id", denuncia.inspector_id)
                .single();

            if (!inspector) {
                return NextResponse.json({
                    inspector_principal: null,
                    acompanantes: [],
                });
            }

            // Obtener acompañantes de la tabla asignaciones_inspector
            const { data: asignaciones } = await supabase
                .from("asignaciones_inspector")
                .select("inspector_id")
                .eq("denuncia_id", denuncia.id)
                .neq("inspector_id", denuncia.inspector_id);

            const acompanantes = [];
            if (asignaciones && asignaciones.length > 0) {
                const acompanantesIds = asignaciones.map((a) => a.inspector_id);
                const { data: inspectoresAcompanantes } = await supabase
                    .from("inspectores")
                    .select("id, nombre, apellido")
                    .in("id", acompanantesIds);

                if (inspectoresAcompanantes) {
                    acompanantes.push(
                        ...inspectoresAcompanantes.map((insp) => ({
                            id: insp.id,
                            nombre: formatFullName(insp.nombre, insp.apellido),
                        }))
                    );
                }
            }

            return NextResponse.json({
                inspector_principal: {
                    id: inspector.id,
                    nombre: formatFullName(inspector.nombre, inspector.apellido),
                },
                acompanantes: acompanantes,
            });
        }

        // Obtener información del inspector principal si existe
        let inspectorPrincipal = null;
        if (asignacion.inspector_principal_id) {
            const { data: inspector } = await supabase
                .from("inspectores")
                .select("id, nombre, apellido")
                .eq("id", asignacion.inspector_principal_id)
                .single();

            if (inspector) {
                inspectorPrincipal = {
                    id: inspector.id,
                    nombre: formatFullName(inspector.nombre, inspector.apellido),
                };
            }
        }

        // Obtener información de los acompañantes si existen
        const acompanantes = [];
        if (
            asignacion.acompanantes_ids &&
            Array.isArray(asignacion.acompanantes_ids) &&
            asignacion.acompanantes_ids.length > 0
        ) {
            const { data: inspectoresAcompanantes } = await supabase
                .from("inspectores")
                .select("id, nombre, apellido")
                .in("id", asignacion.acompanantes_ids);

            if (inspectoresAcompanantes) {
                acompanantes.push(
                    ...inspectoresAcompanantes.map((inspector) => ({
                        id: inspector.id,
                        nombre: formatFullName(inspector.nombre, inspector.apellido),
                    }))
                );
            }
        }

        return NextResponse.json({
            inspector_principal: inspectorPrincipal,
            acompanantes: acompanantes,
        });
    } catch (error) {
        console.error("Error al obtener asignaciones:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Error inesperado",
            },
            { status: 500 }
        );
    }
}
