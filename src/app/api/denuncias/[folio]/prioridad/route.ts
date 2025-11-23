import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkPageAccess } from "@/lib/security/checkPageAccess";

export async function GET() {
    try {
        const supabase = await createClient();

        // Verificar autenticación y autorización
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const hasAccess = await checkPageAccess(supabase, user.id, "/portal/denuncias");
        if (!hasAccess) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }
        const { data, error } = await supabase
            .from("prioridades_denuncia")
            .select("id, nombre, orden")
            .order("orden", { ascending: true });
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ prioridades: data });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}

export async function POST(request: Request, context: { params: Promise<{ folio: string }> }) {
    try {
        const supabase = await createClient();

        // Verificar autenticación y autorización
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const hasAccess = await checkPageAccess(supabase, user.id, "/portal/denuncias");
        if (!hasAccess) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { prioridad_id } = await request.json();
        if (!prioridad_id) {
            return NextResponse.json({ error: "prioridad_id es requerido" }, { status: 400 });
        }
        const { folio } = await context.params;
        if (!folio) {
            return NextResponse.json({ error: "Folio es requerido" }, { status: 400 });
        }
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
