import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        // Obtener todos los inspectores
        const { data: inspectores, error } = await supabase
            .from("inspectores")
            .select("id, usuario_id")
            .order("id", { ascending: true });
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        // Obtener los nombres de los perfiles
        const usuarioIds = (inspectores || []).map((i) => i.usuario_id);
        const { data: perfiles, error: errorPerfiles } = await supabase
            .from("perfiles_ciudadanos")
            .select("usuario_id, nombre, apellido")
            .in("usuario_id", usuarioIds);
        if (errorPerfiles) {
            return NextResponse.json({ error: errorPerfiles.message }, { status: 500 });
        }
        // Mapear nombre completo
        const perfilMap = new Map(
            (perfiles || []).map((p) => [p.usuario_id, `${p.nombre || ''} ${p.apellido || ''}`.trim()])
        );
        const resultado = (inspectores || []).map((i) => ({
            id: i.id,
            nombre: perfilMap.get(i.usuario_id) || "Sin nombre"
        }));
        return NextResponse.json({ inspectores: resultado });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}