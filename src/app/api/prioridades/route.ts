import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("prioridades_denuncia")
            .select("id, nombre")
            .order("orden", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Filtrar prioridades con id o nombre nulos/indefinidos
        const prioridades = (data || [])
            .filter((p) => p.id !== null && p.id !== undefined && p.nombre)
            .map((p) => ({
                id: p.id,
                nombre: p.nombre
            }));

        return NextResponse.json({ prioridades });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}
