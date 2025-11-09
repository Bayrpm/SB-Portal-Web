import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // Contar denuncias activas (asignaciones sin fecha_termino) para este inspector
        const { data: asignaciones, error } = await supabase
            .from("asignaciones_inspector")
            .select("denuncia_id")
            .eq("inspector_id", id)
            .is("fecha_termino", null);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Retornar la carga actual (número de denuncias activas)
        const carga_actual = asignaciones?.length || 0;

        return NextResponse.json({ carga_actual });
    } catch (error) {
        console.error("Error al obtener carga del inspector:", error);
        return NextResponse.json(
            { error: "Error al obtener carga del inspector" },
            { status: 500 }
        );
    }
}
