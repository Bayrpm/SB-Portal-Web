import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: Promise<{ folio: string }> }) {
    try {
        const { prioridad_id } = await request.json();
        if (!prioridad_id) {
            return NextResponse.json({ error: "prioridad_id es requerido" }, { status: 400 });
        }
        const { folio } = await context.params;
        if (!folio) {
            return NextResponse.json({ error: "Folio es requerido" }, { status: 400 });
        }
        const supabase = await createClient();
        const { error } = await supabase
            .from("denuncias")
            .update({ prioridad_id })
            .eq("folio", folio);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}
