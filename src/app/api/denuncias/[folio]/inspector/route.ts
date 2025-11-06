import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function POST(request: Request, context: { params: Promise<{ folio: string }> }) {
    try {
        const { inspector_id, acompanantes_ids } = await request.json();
        const { folio } = await context.params;
        if (!folio) {
            return NextResponse.json({ error: "Folio es requerido" }, { status: 400 });
        }

        if (!inspector_id && (!acompanantes_ids || acompanantes_ids.length === 0)) {
            return NextResponse.json({ error: "Debes enviar inspector_id o acompanantes_ids" }, { status: 400 });
        }

        const supabase = await createClient();

        // Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
        }

        // Obtener el ID de la denuncia usando el folio
        const { data: denuncia, error: denunciaError } = await supabase
            .from("denuncias")
            .select("id")
            .eq("folio", folio)
            .single();

        if (denunciaError || !denuncia) {
            return NextResponse.json({ error: "Denuncia no encontrada" }, { status: 404 });
        }

        // Si viene inspector_id, actualizar la denuncia y eliminar asignaciones previas
        if (inspector_id) {
            // Actualizar el inspector principal en la tabla denuncias
            const { error: updateError } = await supabase
                .from("denuncias")
                .update({ inspector_id: inspector_id })
                .eq("folio", folio);
            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            // Eliminar todas las asignaciones activas previas
            const { error: deleteError } = await supabase
                .from("asignaciones_inspector")
                .delete()
                .eq("denuncia_id", denuncia.id)
                .is("fecha_termino", null);
            if (deleteError) {
                console.error("Error al eliminar asignaciones anteriores:", deleteError);
            }
        }

        // Fecha actual para la derivación
        const fechaDerivacion = new Date().toISOString();
        const asignaciones = [];

        // Si viene inspector_id y no es solo acompañantes, crear asignación principal
        if (inspector_id) {
            asignaciones.push({
                denuncia_id: denuncia.id,
                inspector_id: inspector_id,
                asignado_por: user.id,
                fecha_derivacion: fechaDerivacion,
            });
        }

        // Si vienen acompañantes, crear asignaciones solo para ellos
        if (!inspector_id && acompanantes_ids && Array.isArray(acompanantes_ids) && acompanantes_ids.length > 0) {
            // Eliminar todas las asignaciones activas previas (solo acompañantes)
            const { error: deleteCompanionError } = await supabase
                .from("asignaciones_inspector")
                .delete()
                .eq("denuncia_id", denuncia.id)
                .is("fecha_termino", null);
            if (deleteCompanionError) {
                console.error("Error al eliminar asignaciones anteriores de acompañantes:", deleteCompanionError);
            }
        }
        if (acompanantes_ids && Array.isArray(acompanantes_ids) && acompanantes_ids.length > 0) {
            acompanantes_ids.forEach((acompanante_id: string) => {
                asignaciones.push({
                    denuncia_id: denuncia.id,
                    inspector_id: acompanante_id,
                    asignado_por: user.id,
                    fecha_derivacion: fechaDerivacion,
                });
            });
        }

        // Insertar solo si hay asignaciones
        if (asignaciones.length > 0) {
            const { error: insertError } = await supabase
                .from("asignaciones_inspector")
                .insert(asignaciones);
            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}
