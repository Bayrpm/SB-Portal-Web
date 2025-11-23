import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkPageAccess } from "@/lib/security/checkPageAccess";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Verificar autenticación y autorización
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const hasAccess = await checkPageAccess(supabase, user.id, "/portal/derivaciones");
        if (!hasAccess) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { folios, inspector_id } = await request.json();

        if (!folios || !Array.isArray(folios) || folios.length === 0) {
            return NextResponse.json(
                { error: "Debes enviar al menos un folio" },
                { status: 400 }
            );
        }

        if (!inspector_id) {
            return NextResponse.json(
                { error: "inspector_id es requerido" },
                { status: 400 }
            );
        }

        // Obtener IDs de las denuncias por folio
        const { data: denuncias, error: denunciasError } = await supabase
            .from("denuncias")
            .select("id, folio")
            .in("folio", folios);

        if (denunciasError || !denuncias) {
            return NextResponse.json(
                { error: "Error al obtener denuncias" },
                { status: 500 }
            );
        }

        const fecha_derivacion = new Date().toISOString();
        const asignaciones = [];
        const actualizaciones = [];

        for (const denuncia of denuncias) {
            // Actualizar inspector_id en denuncias
            actualizaciones.push(
                supabase
                    .from("denuncias")
                    .update({ inspector_id: inspector_id })
                    .eq("folio", denuncia.folio)
            );

            // Eliminar asignaciones activas previas
            await supabase
                .from("asignaciones_inspector")
                .delete()
                .eq("denuncia_id", denuncia.id)
                .is("fecha_termino", null);

            // Crear nueva asignación
            asignaciones.push({
                denuncia_id: denuncia.id,
                inspector_id: inspector_id,
                asignado_por: user.id,
                fecha_derivacion: fecha_derivacion,
            });
        }

        // Ejecutar actualizaciones
        await Promise.all(actualizaciones);

        // Insertar asignaciones
        const { error: insertError } = await supabase
            .from("asignaciones_inspector")
            .insert(asignaciones);

        if (insertError) {
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            asignadas: denuncias.length,
        });
    } catch (error) {
        console.error("Error en asignación masiva:", error);
        return NextResponse.json(
            { error: "Error al asignar denuncias" },
            { status: 500 }
        );
    }
}
