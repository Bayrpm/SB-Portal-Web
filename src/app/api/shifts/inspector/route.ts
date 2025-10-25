import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("turno_tipo")
            .select("id, nombre, hora_inicio, hora_termino")
            .eq("activo", true)
            .eq("inspector", true);

        if (error) {
            console.error("Error Supabase:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const turnos = data?.map(turno => ({
            id: turno.id,
            nombre: turno.nombre,
            hora_inicio: turno.hora_inicio,
            hora_termino: turno.hora_termino,

        })) || [];

        return NextResponse.json(turnos);
    } catch (error) {
        console.error("Error al obtener turnos:", error);
        return NextResponse.json({ error: "Error al obtener turnos" }, { status: 500 });
    }
}