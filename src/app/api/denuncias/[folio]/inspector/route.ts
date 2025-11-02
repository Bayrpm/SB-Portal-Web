import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: Promise<{ folio: string }> }) {
    try {
        const { inspector_id, acompanantes_ids } = await request.json();
        if (!inspector_id) {
            return NextResponse.json({ error: "inspector_id es requerido" }, { status: 400 });
        }
        const { folio } = await context.params;
        if (!folio) {
            return NextResponse.json({ error: "Folio es requerido" }, { status: 400 });
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

        // 1. Actualizar el inspector_id en la tabla denuncias
        const { error: updateError } = await supabase
            .from("denuncias")
            .update({ inspector_id: inspector_id })
            .eq("folio", folio);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 2. Eliminar asignaciones anteriores de esta denuncia
        const { error: deleteError } = await supabase
            .from("asignaciones_inspector")
            .delete()
            .eq("denuncia_id", denuncia.id);

        if (deleteError) {
            console.error("Error al eliminar asignaciones anteriores:", deleteError);
        }

        // 3. Crear registro de asignación para el inspector principal
        const asignaciones = [
            {
                denuncia_id: denuncia.id,
                inspector_id: inspector_id,
                asignado_por: user.id,
            }
        ];

        // 4. Agregar registros para cada acompañante
        if (acompanantes_ids && Array.isArray(acompanantes_ids) && acompanantes_ids.length > 0) {
            acompanantes_ids.forEach((acompanante_id: string) => {
                asignaciones.push({
                    denuncia_id: denuncia.id,
                    inspector_id: acompanante_id,
                    asignado_por: user.id,
                });
            });
        }

        // 5. Insertar todas las asignaciones
        const { error: insertError } = await supabase
            .from("asignaciones_inspector")
            .insert(asignaciones);

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}
