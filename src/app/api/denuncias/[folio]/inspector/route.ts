import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function POST(request: Request, context: { params: Promise<{ folio: string }> }) {
    try {
        let { inspector_id, acompanantes_ids } = await request.json();
        const { folio } = await context.params;
        if (!folio) {
            return NextResponse.json({ error: "Folio es requerido" }, { status: 400 });
        }

        if (!inspector_id && (!acompanantes_ids || acompanantes_ids.length === 0)) {
            return NextResponse.json({ error: "Debes enviar inspector_id o acompanantes_ids" }, { status: 400 });
        }

        // Convertir strings numéricos a números
        if (inspector_id && typeof inspector_id === 'string') {
            inspector_id = parseInt(inspector_id, 10);
        }
        if (acompanantes_ids && Array.isArray(acompanantes_ids)) {
            acompanantes_ids = acompanantes_ids.map(id =>
                typeof id === 'string' ? parseInt(id, 10) : id
            );
        }

        // Validar que los IDs sean números válidos
        if (inspector_id && typeof inspector_id !== 'number') {
            return NextResponse.json({ error: "inspector_id debe ser un número válido" }, { status: 400 });
        }
        if (acompanantes_ids && Array.isArray(acompanantes_ids)) {
            for (const id of acompanantes_ids) {
                if (typeof id !== 'number') {
                    return NextResponse.json({ error: `ID de acompañante inválido: "${id}" debe ser un número` }, { status: 400 });
                }
            }
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

        // Ejecutar todas las operaciones en una sola transacción
        const { error: transactionError } = await supabase.rpc("transaction_asignar_inspector", {
            p_denuncia_id: denuncia.id,
            p_folio: folio,
            p_inspector_id: inspector_id || null,
            p_acompanantes_ids: acompanantes_ids && Array.isArray(acompanantes_ids) ? acompanantes_ids : [],
            p_usuario_actual: user.id,
        });

        if (transactionError) {
            console.error("Error en transacción:", transactionError);
            return NextResponse.json({ error: transactionError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}
