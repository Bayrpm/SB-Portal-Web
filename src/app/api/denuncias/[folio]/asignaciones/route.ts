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

        // Si hay error o no existe la denuncia, devolver vacío
        if (asignacionError || !asignacion) {
            return NextResponse.json({
                inspector_principal: null,
                acompanantes: [],
            });
        }

        // Obtener información del inspector principal si existe
        let inspectorPrincipal = null;
        if (asignacion.inspector_principal_id) {
            // Obtener el usuario_id del inspector
            const { data: inspector, error: inspectorError } = await supabase
                .from("inspectores")
                .select("id, usuario_id")
                .eq("id", asignacion.inspector_principal_id)
                .single();

            if (inspector && inspector.usuario_id) {
                // Obtener nombre y apellido desde perfiles_ciudadanos
                const { data: perfil } = await supabase
                    .from("perfiles_ciudadanos")
                    .select("nombre, apellido")
                    .eq("usuario_id", inspector.usuario_id)
                    .single();

                if (perfil) {
                    inspectorPrincipal = {
                        id: String(inspector.id),
                        nombre: formatFullName(perfil.nombre, perfil.apellido),
                    };
                }
            }
        }

        // Obtener información de los acompañantes si existen
        const acompanantes: { id: string; nombre: string }[] = [];
        if (
            asignacion.acompanantes_ids &&
            Array.isArray(asignacion.acompanantes_ids) &&
            asignacion.acompanantes_ids.length > 0
        ) {
            // Filtrar nulls y valores falsy
            const acompanantesIds = asignacion.acompanantes_ids.filter(
                (id: number | null) => id !== null
            );

            if (acompanantesIds.length > 0) {
                // Obtener inspectores acompañantes con sus usuario_id
                const { data: inspectoresAcompanantes } = await supabase
                    .from("inspectores")
                    .select("id, usuario_id")
                    .in("id", acompanantesIds);

                if (inspectoresAcompanantes && inspectoresAcompanantes.length > 0) {
                    // Obtener los usuario_id para buscar perfiles
                    const usuariosIds = inspectoresAcompanantes
                        .map((i) => i.usuario_id)
                        .filter((id) => id !== null);

                    if (usuariosIds.length > 0) {
                        // Obtener perfiles de ciudadanos
                        const { data: perfiles } = await supabase
                            .from("perfiles_ciudadanos")
                            .select("usuario_id, nombre, apellido")
                            .in("usuario_id", usuariosIds);

                        if (perfiles && perfiles.length > 0) {
                            // Mapear inspectores con sus perfiles
                            inspectoresAcompanantes.forEach((inspector) => {
                                const perfil = perfiles.find(
                                    (p) => p.usuario_id === inspector.usuario_id
                                );
                                if (perfil) {
                                    acompanantes.push({
                                        id: String(inspector.id),
                                        nombre: formatFullName(perfil.nombre, perfil.apellido),
                                    });
                                }
                            });
                        }
                    }
                }
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
